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
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

vi.mock("~/models/notification.server", () => ({
  createNotification: vi.fn(),
}));

import {
  getAllowedLendingRequestStatusesForUpdate,
  isItemVisibleInCommunity,
  requestToBorrowItem,
  updateLendingRequestForItemOwner,
} from "./item.server";

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
