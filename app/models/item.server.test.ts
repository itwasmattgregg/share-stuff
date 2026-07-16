import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  lendingRequest: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  item: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

vi.mock("~/models/community.server", () => ({
  getUserCommunities: vi.fn(),
}));

vi.mock("~/models/notification.server", () => ({
  createNotification: vi.fn(),
}));

import { getUserCommunities } from "~/models/community.server";
import {
  getAllowedLendingRequestStatusesForUpdate,
  isItemVisibleInCommunity,
  requestToBorrowItem,
  searchItemsInUserCommunities,
  updateLendingRequestForItemOwner,
} from "./item.server";

const getUserCommunitiesMock = vi.mocked(getUserCommunities);

describe("requestToBorrowItem", () => {
  beforeEach(() => {
    prismaMock.lendingRequest.findFirst.mockReset();
    prismaMock.item.findUnique.mockReset();
    prismaMock.lendingRequest.create.mockReset();
  });

  it("rejects requesting your own item", async () => {
    prismaMock.lendingRequest.findFirst.mockResolvedValue(null);
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: "user-1" });

    await expect(
      requestToBorrowItem({
        requesterId: "user-1",
        itemId: "item-1",
      })
    ).rejects.toThrow("You cannot request your own item");

    expect(prismaMock.lendingRequest.create).not.toHaveBeenCalled();
  });

  it("creates a request when the requester is not the owner", async () => {
    prismaMock.lendingRequest.findFirst.mockResolvedValue(null);
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: "owner-1" });
    prismaMock.lendingRequest.create.mockResolvedValue({ id: "request-1" });

    await requestToBorrowItem({
      requesterId: "borrower-1",
      itemId: "item-1",
    });

    expect(prismaMock.lendingRequest.create).toHaveBeenCalledWith({
      data: {
        requesterId: "borrower-1",
        itemId: "item-1",
        itemOwnerId: "owner-1",
        requestNote: undefined,
      },
    });
  });
});

describe("getAllowedLendingRequestStatusesForUpdate", () => {
  it("allows rejecting or approving pending requests", () => {
    expect(getAllowedLendingRequestStatusesForUpdate("REJECTED")).toEqual([
      "PENDING",
    ]);
    expect(getAllowedLendingRequestStatusesForUpdate("APPROVED")).toEqual([
      "PENDING",
    ]);
  });

  it("allows returning borrowed items", () => {
    expect(getAllowedLendingRequestStatusesForUpdate("RETURNED")).toEqual([
      "BORROWED",
    ]);
  });
});

describe("updateLendingRequestForItemOwner", () => {
  beforeEach(() => {
    prismaMock.item.findUnique.mockReset();
    prismaMock.lendingRequest.findUnique.mockReset();
    prismaMock.lendingRequest.update.mockReset();
    prismaMock.item.update.mockReset();
  });

  it("rejects queue requests for non-owners", async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      id: "item-1",
      ownerId: "owner-1",
    });

    await expect(
      updateLendingRequestForItemOwner({
        userId: "other-user",
        itemId: "item-1",
        requestId: "request-1",
        status: "REJECTED",
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("updates a pending request to rejected for the owner", async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      id: "item-1",
      ownerId: "owner-1",
    });
    prismaMock.lendingRequest.findUnique.mockResolvedValue({
      id: "request-1",
      itemId: "item-1",
      status: "PENDING",
      requesterId: "borrower-1",
      itemOwnerId: "owner-1",
      item: { id: "item-1", name: "Hammer" },
      requester: { id: "borrower-1" },
      itemOwner: { id: "owner-1" },
    });
    prismaMock.lendingRequest.update.mockResolvedValue({
      id: "request-1",
      itemId: "item-1",
    });

    const result = await updateLendingRequestForItemOwner({
      userId: "owner-1",
      itemId: "item-1",
      requestId: "request-1",
      status: "REJECTED",
    });

    expect(result.id).toBe("request-1");
    expect(prismaMock.lendingRequest.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: { status: "REJECTED", responseNote: undefined },
    });
  });
});

describe("isItemVisibleInCommunity", () => {
  beforeEach(() => {
    prismaMock.item.count.mockReset();
  });

  it("returns true when the item belongs to a community member", async () => {
    prismaMock.item.count.mockResolvedValue(1);

    await expect(
      isItemVisibleInCommunity({ itemId: "item-1", communityId: "community-1" })
    ).resolves.toBe(true);

    expect(prismaMock.item.count).toHaveBeenCalledWith({
      where: {
        id: "item-1",
        owner: {
          OR: [
            { ownedCommunities: { some: { id: "community-1" } } },
            {
              communityMemberships: {
                some: { communityId: "community-1", status: "APPROVED" },
              },
            },
          ],
        },
      },
    });
  });

  it("returns false when the item is outside the community", async () => {
    prismaMock.item.count.mockResolvedValue(0);

    await expect(
      isItemVisibleInCommunity({ itemId: "item-1", communityId: "community-1" })
    ).resolves.toBe(false);
  });
});

describe("searchItemsInUserCommunities", () => {
  beforeEach(() => {
    getUserCommunitiesMock.mockReset();
    prismaMock.item.findMany.mockReset();
  });

  it("returns an empty array when the search term is empty", async () => {
    await expect(
      searchItemsInUserCommunities({ userId: "user-1", search: "   " })
    ).resolves.toEqual([]);

    expect(getUserCommunitiesMock).not.toHaveBeenCalled();
    expect(prismaMock.item.findMany).not.toHaveBeenCalled();
  });

  it("returns an empty array when the user has no communities", async () => {
    getUserCommunitiesMock.mockResolvedValue([]);

    await expect(
      searchItemsInUserCommunities({ userId: "user-1", search: "hammer" })
    ).resolves.toEqual([]);

    expect(prismaMock.item.findMany).not.toHaveBeenCalled();
  });

  it("queries across all user communities with a text filter", async () => {
    getUserCommunitiesMock.mockResolvedValue([
      {
        id: "community-1",
        name: "Alpha Community",
        ownerId: "user-1",
        description: null,
        rules: null,
        isListed: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", email: "a@example.com", name: "A" },
        _count: { memberships: 1 },
      },
      {
        id: "community-2",
        name: "Beta Community",
        ownerId: "user-2",
        description: null,
        rules: null,
        isListed: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-2", email: "b@example.com", name: "B" },
        _count: { memberships: 2 },
      },
    ] as Awaited<ReturnType<typeof getUserCommunities>>);
    prismaMock.item.findMany.mockResolvedValue([]);

    await searchItemsInUserCommunities({ userId: "user-1", search: "hammer" });

    expect(prismaMock.item.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            owner: {
              OR: [
                { ownedCommunities: { some: { id: "community-1" } } },
                {
                  communityMemberships: {
                    some: { communityId: "community-1", status: "APPROVED" },
                  },
                },
              ],
            },
          },
          {
            owner: {
              OR: [
                { ownedCommunities: { some: { id: "community-2" } } },
                {
                  communityMemberships: {
                    some: { communityId: "community-2", status: "APPROVED" },
                  },
                },
              ],
            },
          },
        ],
        AND: [
          {
            OR: [
              { name: { contains: "hammer" } },
              { description: { contains: "hammer" } },
              { category: { contains: "hammer" } },
            ],
          },
        ],
      },
      include: expect.any(Object),
      orderBy: { createdAt: "desc" },
    });
  });

  it("attaches visible communities sorted by name", async () => {
    getUserCommunitiesMock.mockResolvedValue([
      {
        id: "community-1",
        name: "Zulu Community",
        ownerId: "user-1",
        description: null,
        rules: null,
        isListed: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", email: "a@example.com", name: "A" },
        _count: { memberships: 1 },
      },
      {
        id: "community-2",
        name: "Alpha Community",
        ownerId: "user-2",
        description: null,
        rules: null,
        isListed: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-2", email: "b@example.com", name: "B" },
        _count: { memberships: 2 },
      },
    ] as Awaited<ReturnType<typeof getUserCommunities>>);
    prismaMock.item.findMany.mockResolvedValue([
      {
        id: "item-1",
        name: "Hammer",
        description: "A hammer",
        category: "tool",
        condition: "good",
        photoKey: null,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "owner-1",
        owner: {
          id: "owner-1",
          email: "owner@example.com",
          name: "Owner",
          ownedCommunities: [{ id: "community-2" }],
          communityMemberships: [{ communityId: "community-1" }],
        },
        itemTags: [],
        lendingRequests: [],
      },
    ]);

    const results = await searchItemsInUserCommunities({
      userId: "user-1",
      search: "hammer",
    });

    expect(results).toHaveLength(1);
    expect(results[0].visibleCommunities).toEqual([
      { id: "community-2", name: "Alpha Community" },
      { id: "community-1", name: "Zulu Community" },
    ]);
    expect(results[0].primaryCommunityId).toBe("community-2");
  });
});
