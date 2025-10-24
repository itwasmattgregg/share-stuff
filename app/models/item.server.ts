import type { User, Item, LendingRequest, LendingStatus } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Item, LendingRequest, LendingStatus } from "@prisma/client";

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
              { name: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
              { category: { contains: searchTerm, mode: "insensitive" } },
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
  ownerId,
}: {
  name: string;
  description?: string;
  category?: string;
  condition?: string;
  ownerId: string;
}) {
  return prisma.item.create({
    data: {
      name,
      description,
      category,
      condition,
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
}: {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  condition?: string;
  isAvailable?: boolean;
}) {
  return prisma.item.update({
    where: { id },
    data: {
      name,
      description,
      category,
      condition,
      isAvailable,
    },
  });
}

export async function deleteItem({ id }: { id: string }) {
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
        in: ["PENDING", "APPROVED"],
      },
    },
  });

  if (existingRequest) {
    throw new Error(
      "You already have a pending or approved request for this item"
    );
  }

  return prisma.lendingRequest.create({
    data: {
      requesterId,
      itemId,
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
