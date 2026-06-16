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
  joinCommunityFromInviteRedirect,
  joinCommunityViaInvite,
  parseInviteTokenFromRedirect,
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

  it("parses invite tokens from redirect paths", () => {
    expect(parseInviteTokenFromRedirect("/invite/abc123")).toBe("abc123");
    expect(parseInviteTokenFromRedirect("/communities")).toBeNull();
    expect(parseInviteTokenFromRedirect("//evil.com/invite/abc123")).toBeNull();
  });
});

describe("joinCommunityViaInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves membership for invitees", async () => {
    prismaMock.community.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      isArchived: false,
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
      isArchived: false,
    });

    const result = await joinCommunityViaInvite({
      userId: "owner-1",
      communityId: "community-1",
    });

    expect(result.alreadyMember).toBe(true);
    expect(prismaMock.communityMembership.upsert).not.toHaveBeenCalled();
  });

  it("rejects invites for archived communities", async () => {
    prismaMock.community.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      isArchived: true,
    });

    await expect(
      joinCommunityViaInvite({
        userId: "user-1",
        communityId: "community-1",
      })
    ).rejects.toThrow("This community has been archived");
  });
});

describe("joinCommunityFromInviteRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("joins the community when redirect points to a valid invite", async () => {
    prismaMock.communityInvite.findUnique.mockResolvedValue({
      communityId: "community-1",
      expiresAt: new Date(Date.now() + 60_000),
      community: { isArchived: false },
    });
    prismaMock.community.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      isArchived: false,
    });

    const communityId = await joinCommunityFromInviteRedirect({
      userId: "user-1",
      redirectTo: "/invite/token-1",
    });

    expect(communityId).toBe("community-1");
    expect(prismaMock.communityMembership.upsert).toHaveBeenCalled();
  });

  it("ignores redirects that are not invite links", async () => {
    const communityId = await joinCommunityFromInviteRedirect({
      userId: "user-1",
      redirectTo: "/communities",
    });

    expect(communityId).toBeNull();
    expect(prismaMock.communityInvite.findUnique).not.toHaveBeenCalled();
  });
});
