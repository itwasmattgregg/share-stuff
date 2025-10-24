import type {
  User,
  Community,
  CommunityMembership,
  MembershipStatus,
} from "@prisma/client";

import { prisma } from "~/db.server";

export type {
  Community,
  CommunityMembership,
  MembershipStatus,
} from "@prisma/client";

export async function getCommunity({ id }: { id: string }) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      memberships: {
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      },
    },
  });
}

export async function getCommunities() {
  return prisma.community.findMany({
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserCommunities({ userId }: { userId: string }) {
  return prisma.community.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          memberships: {
            some: {
              userId,
              status: "APPROVED",
            },
          },
        },
      ],
    },
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCommunity({
  name,
  description,
  rules,
  ownerId,
}: {
  name: string;
  description?: string;
  rules?: string;
  ownerId: string;
}) {
  return prisma.community.create({
    data: {
      name,
      description,
      rules,
      ownerId,
      memberships: {
        create: {
          userId: ownerId,
          status: "APPROVED",
        },
      },
    },
  });
}

export async function requestToJoinCommunity({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  return prisma.communityMembership.upsert({
    where: {
      userId_communityId: {
        userId,
        communityId,
      },
    },
    update: {
      status: "PENDING",
    },
    create: {
      userId,
      communityId,
      status: "PENDING",
    },
  });
}

export async function getPendingMemberships({
  communityId,
}: {
  communityId: string;
}) {
  return prisma.communityMembership.findMany({
    where: {
      communityId,
      status: "PENDING",
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

export async function updateMembershipStatus({
  membershipId,
  status,
}: {
  membershipId: string;
  status: MembershipStatus;
}) {
  return prisma.communityMembership.update({
    where: { id: membershipId },
    data: { status },
  });
}

export async function isUserMemberOfCommunity({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId,
      },
    },
  });

  return membership?.status === "APPROVED";
}

export async function isUserOwnerOfCommunity({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  });

  return community?.ownerId === userId;
}
