import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  community: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  communityMembership: {
    upsert: vi.fn(),
  },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

import {
  isCommunityArchived,
  requestToJoinCommunity,
  setCommunityArchived,
} from "./community.server";

describe("setCommunityArchived", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archives a community and removes it from discovery", async () => {
    prismaMock.community.update.mockResolvedValue({ id: "community-1" });

    await setCommunityArchived({ id: "community-1", isArchived: true });

    expect(prismaMock.community.update).toHaveBeenCalledWith({
      where: { id: "community-1" },
      data: { isArchived: true, isListed: false },
    });
  });

  it("restores a community without automatically relisting it", async () => {
    prismaMock.community.update.mockResolvedValue({ id: "community-1" });

    await setCommunityArchived({ id: "community-1", isArchived: false });

    expect(prismaMock.community.update).toHaveBeenCalledWith({
      where: { id: "community-1" },
      data: { isArchived: false },
    });
  });
});

describe("isCommunityArchived", () => {
  it("returns true for archived communities", async () => {
    prismaMock.community.findUnique.mockResolvedValue({ isArchived: true });

    await expect(isCommunityArchived({ id: "community-1" })).resolves.toBe(true);
  });
});

describe("requestToJoinCommunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks join requests for archived communities", async () => {
    prismaMock.community.findUnique.mockResolvedValue({ isArchived: true });

    await expect(
      requestToJoinCommunity({ userId: "user-1", communityId: "community-1" })
    ).rejects.toThrow("This community has been archived");
  });
});
