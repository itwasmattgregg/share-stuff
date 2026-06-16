import { randomBytes } from "node:crypto";

import { prisma } from "~/db.server";
import { isCommunityArchived } from "~/models/community.server";

const INVITE_EXPIRY_DAYS = 5;

export function getInviteExpiryDate(from = new Date()) {
  return new Date(from.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

function createInviteToken() {
  return randomBytes(24).toString("base64url");
}

export async function createCommunityInvite({
  communityId,
  createdById,
}: {
  communityId: string;
  createdById: string;
}) {
  if (await isCommunityArchived({ id: communityId })) {
    throw new Error("This community has been archived");
  }

  return prisma.communityInvite.create({
    data: {
      token: createInviteToken(),
      communityId,
      createdById,
      expiresAt: getInviteExpiryDate(),
    },
    include: {
      community: {
        select: { id: true, name: true, description: true, isArchived: true },
      },
    },
  });
}

export async function getCommunityInviteByToken({ token }: { token: string }) {
  return prisma.communityInvite.findUnique({
    where: { token },
    include: {
      community: {
        select: { id: true, name: true, description: true, isArchived: true },
      },
    },
  });
}

export function isCommunityInviteValid(invite: { expiresAt: Date }) {
  return invite.expiresAt.getTime() > Date.now();
}

export function parseInviteTokenFromRedirect(redirectTo: string) {
  const match = redirectTo.match(/^\/invite\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function joinCommunityFromInviteRedirect({
  userId,
  redirectTo,
}: {
  userId: string;
  redirectTo: string;
}) {
  const inviteToken = parseInviteTokenFromRedirect(redirectTo);
  if (!inviteToken) {
    return null;
  }

  const invite = await getCommunityInviteByToken({ token: inviteToken });
  if (
    !invite ||
    !isCommunityInviteValid(invite) ||
    invite.community.isArchived
  ) {
    return null;
  }

  await joinCommunityViaInvite({
    userId,
    communityId: invite.communityId,
  });

  return invite.communityId;
}

export async function joinCommunityViaInvite({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true, isArchived: true },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  if (community.isArchived) {
    throw new Error("This community has been archived");
  }

  if (community.ownerId === userId) {
    return { alreadyMember: true };
  }

  await prisma.communityMembership.upsert({
    where: {
      userId_communityId: {
        userId,
        communityId,
      },
    },
    update: {
      status: "APPROVED",
    },
    create: {
      userId,
      communityId,
      status: "APPROVED",
    },
  });

  return { alreadyMember: false };
}
