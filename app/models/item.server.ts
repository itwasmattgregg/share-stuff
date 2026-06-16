import type { User, Item, LendingRequest } from "@prisma/client";

import { prisma } from "~/db.server";
import { createNotification } from "~/models/notification.server";
import { removeItemPhoto } from "~/utils/item-photo.server";

export type LendingStatus = "PENDING" | "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED";

export const ACTIVE_BORROWER_REQUEST_STATUSES: LendingStatus[] = [
  "PENDING",
  "APPROVED",
  "BORROWED",
];

export function getActiveBorrowerRequestForUser<
  T extends { requesterId: string; status: string },
>(lendingRequests: T[], userId: string) {
  return lendingRequests.find(
    (request) =>
      request.requesterId === userId &&
      ACTIVE_BORROWER_REQUEST_STATUSES.includes(
        request.status as LendingStatus
      )
  );
}

export function getBorrowerRequestStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Request pending";
    case "APPROVED":
      return "Approved";
    case "BORROWED":
      return "Borrowing";
    default:
      return "Requested";
  }
}

export type { Item, LendingRequest };

export async function getItem({ id }: { id: string }) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      lendingRequests: {
        include: {
          requester: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getCommunityItems({
  communityId,
  search,
}: {
  communityId: string;
  search?: string;
}) {
  // Get all items from users who are members of this community
  const whereClause: any = {
    owner: {
      OR: [
        // Community owner
        {
          ownedCommunities: {
            some: { id: communityId },
          },
        },
        // Community members
        {
          communityMemberships: {
            some: {
              communityId,
              status: "APPROVED",
            },
          },
        },
      ],
    },
  };

      // Add search functionality if search term is provided
      if (search && search.trim()) {
        const searchTerm = search.trim();
        whereClause.AND = [
          {
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
              { category: { contains: searchTerm } },
            ],
          },
        ];
      }

  return prisma.item.findMany({
    where: whereClause,
    include: {
      owner: {
        select: { id: true, email: true, name: true },
      },
      lendingRequests: {
        where: {
          status: {
            in: ["PENDING", "APPROVED", "BORROWED"],
          },
        },
        include: {
          requester: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserItems({ userId }: { userId: string }) {
  return prisma.item.findMany({
    where: { ownerId: userId },
    include: {
      lendingRequests: {
        include: {
          requester: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createItem({
  name,
  description,
  category,
  condition,
  photoKey,
  ownerId,
}: {
  name: string;
  description?: string;
  category?: string;
  condition?: string;
  photoKey?: string;
  ownerId: string;
}) {
  return prisma.item.create({
    data: {
      name,
      description,
      category,
      condition,
      photoKey,
      ownerId,
    },
  });
}

export async function updateItem({
  id,
  name,
  description,
  category,
  condition,
  isAvailable,
  photoKey,
}: {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  condition?: string;
  isAvailable?: boolean;
  photoKey?: string | null;
}) {
  return prisma.item.update({
    where: { id },
    data: {
      name,
      description,
      category,
      condition,
      isAvailable,
      photoKey,
    },
  });
}

export async function deleteItem({ id }: { id: string }) {
  const item = await prisma.item.findUnique({
    where: { id },
    select: { photoKey: true },
  });

  if (item?.photoKey) {
    await removeItemPhoto(item.photoKey);
  }

  return prisma.item.delete({
    where: { id },
  });
}

export async function requestToBorrowItem({
  requesterId,
  itemId,
  requestNote,
}: {
  requesterId: string;
  itemId: string;
  requestNote?: string;
}) {
  // Check if user already has a pending or approved request for this item
  const existingRequest = await prisma.lendingRequest.findFirst({
    where: {
      requesterId,
      itemId,
      status: {
        in: ACTIVE_BORROWER_REQUEST_STATUSES,
      },
    },
  });

  if (existingRequest) {
    throw new Error(
      "You already have an active request for this item"
    );
  }

  // Get the item to find the owner
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { ownerId: true },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.ownerId === requesterId) {
    throw new Error("You cannot request your own item");
  }

  return prisma.lendingRequest.create({
    data: {
      requesterId,
      itemId,
      itemOwnerId: item.ownerId,
      requestNote,
    },
  });
}

export async function getLendingRequestsForUser({
  userId,
}: {
  userId: string;
}) {
  return prisma.lendingRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { itemOwnerId: userId }],
    },
    include: {
      requester: {
        select: { id: true, email: true, name: true },
      },
      itemOwner: {
        select: { id: true, email: true, name: true },
      },
      item: {
        select: { id: true, name: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateLendingRequestStatus({
  requestId,
  status,
  responseNote,
}: {
  requestId: string;
  status: LendingStatus;
  responseNote?: string;
}) {
  const request = await prisma.lendingRequest.update({
    where: { id: requestId },
    data: { status, responseNote },
  });

  // If approved, mark item as unavailable
  if (status === "APPROVED") {
    await prisma.item.update({
      where: { id: request.itemId },
      data: { isAvailable: false },
    });
  }

  // If returned, mark item as available
  if (status === "RETURNED") {
    await prisma.item.update({
      where: { id: request.itemId },
      data: { isAvailable: true },
    });
  }

  return request;
}

export function getAllowedLendingRequestStatusesForUpdate(
  targetStatus: LendingStatus
): LendingStatus[] {
  switch (targetStatus) {
    case "APPROVED":
    case "REJECTED":
      return ["PENDING"];
    case "BORROWED":
      return ["APPROVED"];
    case "RETURNED":
      return ["BORROWED"];
    default:
      return [];
  }
}

export async function updateLendingRequestForItemOwner({
  userId,
  itemId,
  requestId,
  status,
  responseNote,
}: {
  userId: string;
  itemId: string;
  requestId: string;
  status: LendingStatus;
  responseNote?: string;
}) {
  const allowedFromStatuses = getAllowedLendingRequestStatusesForUpdate(status);

  if (allowedFromStatuses.length === 0) {
    throw new Error("Invalid status");
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, ownerId: true },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  const lendingRequest = await prisma.lendingRequest.findUnique({
    where: { id: requestId },
    include: {
      item: {
        select: { id: true, name: true },
      },
      requester: {
        select: { id: true },
      },
      itemOwner: {
        select: { id: true },
      },
    },
  });

  if (!lendingRequest || lendingRequest.itemId !== itemId) {
    throw new Error("Invalid request");
  }

  if (
    !allowedFromStatuses.includes(lendingRequest.status as LendingStatus)
  ) {
    throw new Error("Invalid request status transition");
  }

  await updateLendingRequestStatus({
    requestId,
    status,
    responseNote,
  });

  return lendingRequest;
}

export async function notifyLendingRequestStatusChange({
  lendingRequest,
  status,
  links,
}: {
  lendingRequest: {
    requesterId: string;
    itemOwnerId: string;
    item: { name: string };
  };
  status: LendingStatus;
  links: {
    requester: string;
    owner: string;
  };
}) {
  const itemName = lendingRequest.item.name;

  if (status === "APPROVED") {
    await createNotification({
      userId: lendingRequest.requesterId,
      type: "LENDING_APPROVED",
      title: "Lending Request Approved",
      message: `Your request to borrow "${itemName}" has been approved!`,
      link: links.requester,
    });
  } else if (status === "REJECTED") {
    await createNotification({
      userId: lendingRequest.requesterId,
      type: "LENDING_REJECTED",
      title: "Lending Request Rejected",
      message: `Your request to borrow "${itemName}" has been rejected.`,
      link: links.requester,
    });
  } else if (status === "BORROWED") {
    await createNotification({
      userId: lendingRequest.requesterId,
      type: "ITEM_BORROWED",
      title: "Item Marked as Borrowed",
      message: `"${itemName}" has been marked as borrowed.`,
      link: links.requester,
    });
    await createNotification({
      userId: lendingRequest.itemOwnerId,
      type: "ITEM_BORROWED",
      title: "Item Borrowed",
      message: `Someone has borrowed "${itemName}".`,
      link: links.owner,
    });
  } else if (status === "RETURNED") {
    await createNotification({
      userId: lendingRequest.requesterId,
      type: "ITEM_RETURNED",
      title: "Item Returned",
      message: `"${itemName}" has been marked as returned.`,
      link: links.requester,
    });
    await createNotification({
      userId: lendingRequest.itemOwnerId,
      type: "ITEM_RETURNED",
      title: "Item Returned",
      message: `"${itemName}" has been returned.`,
      link: links.owner,
    });
  }
}

export async function getCurrentBorrower({ itemId }: { itemId: string }) {
  const request = await prisma.lendingRequest.findFirst({
    where: {
      itemId,
      status: "BORROWED",
    },
    include: {
      requester: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return request?.requester;
}
