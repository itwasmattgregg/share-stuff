import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  communityInvite: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  community: {
    findUnique: vi.fn(),
  },
  communityMembership: {
    upsert: vi.fn(),
  },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

import {
  getInviteExpiryDate,
  isCommunityInviteValid,
  joinCommunityViaInvite,
} from "./community-invite.server";

describe("community invite helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expires invites after 5 days", () => {
    const now = new Date("2024-01-01T12:00:00");
    const expiresAt = getInviteExpiryDate(now);

    expect(expiresAt.getTime() - now.getTime()).toBe(5 * 24 * 60 * 60 * 1000);
  });

  it("rejects expired invites", () => {
    expect(
      isCommunityInviteValid({
        expiresAt: new Date(Date.now() - 1000),
      })
    ).toBe(false);
  });

  it("accepts unexpired invites", () => {
    expect(
      isCommunityInviteValid({
        expiresAt: new Date(Date.now() + 60_000),
      })
    ).toBe(true);
  });
});

describe("joinCommunityViaInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves membership for invitees", async () => {
    prismaMock.community.findUnique.mockResolvedValue({
      ownerId: "owner-1",
    });

    await joinCommunityViaInvite({
      userId: "user-1",
      communityId: "community-1",
    });

    expect(prismaMock.communityMembership.upsert).toHaveBeenCalledWith({
      where: {
        userId_communityId: {
          userId: "user-1",
          communityId: "community-1",
        },
      },
      update: { status: "APPROVED" },
      create: {
        userId: "user-1",
        communityId: "community-1",
        status: "APPROVED",
      },
    });
  });

  it("does not create membership for the community owner", async () => {
    prismaMock.community.findUnique.mockResolvedValue({
      ownerId: "owner-1",
    });

    const result = await joinCommunityViaInvite({
      userId: "owner-1",
      communityId: "community-1",
    });

    expect(result.alreadyMember).toBe(true);
    expect(prismaMock.communityMembership.upsert).not.toHaveBeenCalled();
  });
});
