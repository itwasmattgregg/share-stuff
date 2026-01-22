import { prisma } from "~/db.server";
import type { Conversation, Message } from "@prisma/client";

export type { Conversation, Message };

/**
 * Normalize user IDs to ensure userId1 < userId2 for consistent storage
 */
function normalizeUserIds(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

/**
 * Get all conversations for a user, grouped by community
 * Includes latest message preview and unread count
 */
export async function getConversationsForUser({ userId }: { userId: string }) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        select: { id: true, email: true, name: true },
      },
      user2: {
        select: { id: true, email: true, name: true },
      },
      community: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              readAt: null,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by community and format
  const grouped = conversations.reduce((acc, conv) => {
    const otherUser = conv.userId1 === userId ? conv.user2 : conv.user1;
    const latestMessage = conv.messages[0] || null;

    if (!acc[conv.community.id]) {
      acc[conv.community.id] = {
        community: conv.community,
        conversations: [],
      };
    }

    acc[conv.community.id].conversations.push({
      id: conv.id,
      otherUser,
      latestMessage,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt,
    });

    return acc;
  }, {} as Record<string, { community: { id: string; name: string }; conversations: Array<{ id: string; otherUser: { id: string; email: string; name: string | null }; latestMessage: { id: string; content: string; senderId: string; createdAt: Date; sender: { id: string; name: string | null; email: string } } | null; unreadCount: number; updatedAt: Date }> }>);

  return Object.values(grouped);
}

/**
 * Get a specific conversation with all messages
 * Verifies user is a participant
 */
export async function getConversation({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        select: { id: true, email: true, name: true },
      },
      user2: {
        select: { id: true, email: true, name: true },
      },
      community: {
        select: { id: true, name: true, description: true },
      },
      messages: {
        include: {
          sender: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const otherUser = conversation.userId1 === userId ? conversation.user2 : conversation.user1;

  return {
    ...conversation,
    otherUser,
  };
}

/**
 * Get or create a conversation between two users in a community
 * Ensures both users are approved members of the community
 */
export async function getOrCreateConversation({
  userId1,
  userId2,
  communityId,
}: {
  userId1: string;
  userId2: string;
  communityId: string;
}) {
  // Normalize user IDs
  const [normalizedUserId1, normalizedUserId2] = normalizeUserIds(userId1, userId2);

  // Verify both users are members of the community
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      memberships: {
        where: {
          userId: { in: [normalizedUserId1, normalizedUserId2] },
          status: "APPROVED",
        },
      },
      owner: {
        select: { id: true },
      },
    },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  // Check if users are members (including owner)
  const userIds = new Set([
    community.ownerId,
    ...community.memberships.map((m) => m.userId),
  ]);

  if (!userIds.has(normalizedUserId1) || !userIds.has(normalizedUserId2)) {
    throw new Error("Both users must be approved members of the community");
  }

  // Try to find existing conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      userId1_userId2_communityId: {
        userId1: normalizedUserId1,
        userId2: normalizedUserId2,
        communityId,
      },
    },
  });

  // Create if doesn't exist
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId1: normalizedUserId1,
        userId2: normalizedUserId2,
        communityId,
      },
    });
  }

  return conversation;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage({
  conversationId,
  senderId,
  content,
}: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  // Verify sender is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: senderId }, { userId2: senderId }],
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  if (!content.trim()) {
    throw new Error("Message content cannot be empty");
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content.trim(),
    },
    include: {
      sender: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Mark messages in a conversation as read
 */
export async function markMessagesAsRead({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  // Verify user is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: userId }, { userId2: userId }],
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  // Mark all unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

/**
 * Get community members that the user can message
 * Returns approved members excluding the current user
 */
export async function getCommunityMembersForMessaging({
  communityId,
  userId,
}: {
  communityId: string;
  userId: string;
}) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      memberships: {
        where: {
          status: "APPROVED",
          userId: { not: userId },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      },
    },
  });

  if (!community) {
    return [];
  }

  const members = [];

  // Add owner if not the current user
  if (community.ownerId !== userId) {
    members.push(community.owner);
  }

  // Add approved members
  members.push(...community.memberships.map((m) => m.user));

  return members;
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount({ userId }: { userId: string }) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    select: {
      id: true,
    },
  });

  const conversationIds = conversations.map((c) => c.id);

  if (conversationIds.length === 0) {
    return 0;
  }

  return prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      readAt: null,
    },
  });
}
