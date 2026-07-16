import type { Tag } from "@prisma/client";

import { prisma } from "~/db.server";
import { communityItemOwnerFilter } from "~/models/item.server";
import {
  formatTagDisplayName,
  normalizeTagSlug,
} from "~/utils/tag";

export type { Tag };

export type PopularTag = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

function userVisibleItemOwnerFilter(userId: string) {
  return {
    OR: [
      {
        ownedCommunities: {
          some: {
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
        },
      },
      {
        communityMemberships: {
          some: {
            status: "APPROVED",
            community: {
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
          },
        },
      },
    ],
  };
}

function visibleItemWhere({
  userId,
  communityId,
}: {
  userId: string;
  communityId?: string;
}) {
  if (communityId) {
    return communityItemOwnerFilter(communityId);
  }

  return {
    owner: userVisibleItemOwnerFilter(userId),
  };
}

export async function upsertTagsByName(names: string[]): Promise<Tag[]> {
  const tags: Tag[] = [];

  for (const name of names) {
    const slug = normalizeTagSlug(name);
    if (!slug) continue;

    const tag = await prisma.tag.upsert({
      where: { slug },
      create: {
        slug,
        name: name.trim() || formatTagDisplayName(slug),
      },
      update: {},
    });

    tags.push(tag);
  }

  return tags;
}

export async function syncItemTags(itemId: string, tagNames: string[]) {
  const tags = await upsertTagsByName(tagNames);

  await prisma.itemTag.deleteMany({
    where: { itemId },
  });

  if (tags.length === 0) {
    return [];
  }

  await prisma.$transaction(
    tags.map((tag) =>
      prisma.itemTag.create({
        data: {
          itemId,
          tagId: tag.id,
        },
      })
    )
  );

  return tags;
}

export async function getTagSuggestions({
  query,
  userId,
  limit = 8,
}: {
  query: string;
  userId: string;
  limit?: number;
}) {
  const slugQuery = normalizeTagSlug(query);
  if (!slugQuery) {
    return [];
  }

  const tags = await prisma.tag.findMany({
    where: {
      slug: { contains: slugQuery },
      itemTags: {
        some: {
          item: visibleItemWhere({ userId }),
        },
      },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  return tags;
}

export async function getPopularTags({
  userId,
  communityId,
  ownerId,
  limit = 20,
}: {
  userId: string;
  communityId?: string;
  ownerId?: string;
  limit?: number;
}): Promise<PopularTag[]> {
  const itemWhere = ownerId
    ? { ownerId }
    : visibleItemWhere({ userId, communityId });

  const itemTags = await prisma.itemTag.groupBy({
    by: ["tagId"],
    where: {
      item: itemWhere,
    },
    _count: {
      tagId: true,
    },
    orderBy: {
      _count: {
        tagId: "desc",
      },
    },
    take: limit,
  });

  if (itemTags.length === 0) {
    return [];
  }

  const tagIds = itemTags.map((entry) => entry.tagId);
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
  });
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  return itemTags
    .map((entry) => {
      const tag = tagById.get(entry.tagId);
      if (!tag) return null;

      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: entry._count.tagId,
      };
    })
    .filter((tag): tag is PopularTag => tag !== null);
}

const itemIncludeWithTags = {
  owner: {
    select: { id: true, email: true, name: true },
  },
  itemTags: {
    include: {
      tag: true,
    },
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
    orderBy: { createdAt: "desc" as const },
  },
};

export async function getItemsByTagSlug({
  slug,
  userId,
  communityId,
}: {
  slug: string;
  userId: string;
  communityId?: string;
}) {
  const normalizedSlug = normalizeTagSlug(slug);
  if (!normalizedSlug) {
    return { tag: null, items: [] };
  }

  const tag = await prisma.tag.findUnique({
    where: { slug: normalizedSlug },
  });

  if (!tag) {
    return { tag: null, items: [] };
  }

  const items = await prisma.item.findMany({
    where: {
      ...visibleItemWhere({ userId, communityId }),
      itemTags: {
        some: {
          tagId: tag.id,
        },
      },
    },
    include: itemIncludeWithTags,
    orderBy: { createdAt: "desc" },
  });

  return { tag, items };
}

export async function getTagBySlug(slug: string) {
  const normalizedSlug = normalizeTagSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  return prisma.tag.findUnique({
    where: { slug: normalizedSlug },
  });
}
