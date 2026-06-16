import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { count: vi.fn() },
  community: { count: vi.fn(), findMany: vi.fn() },
  item: { count: vi.fn(), groupBy: vi.fn() },
  lendingRequest: {
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  report: { count: vi.fn() },
  communityMembership: { groupBy: vi.fn() },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

import { formatDays } from "~/utils";

import { getPlatformAnalytics } from "./analytics.server";

describe("formatDays", () => {
  it("formats null as an em dash", () => {
    expect(formatDays(null)).toBe("—");
  });

  it("formats sub-day durations", () => {
    expect(formatDays(0.5)).toBe("< 1 day");
  });

  it("formats multi-day durations", () => {
    expect(formatDays(3.456)).toBe("3.5 days");
  });
});

describe("getPlatformAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.user.count.mockResolvedValue(10);
    prismaMock.community.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);
    prismaMock.item.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(15);
    prismaMock.lendingRequest.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prismaMock.report.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    prismaMock.lendingRequest.findMany
      .mockResolvedValueOnce([
        {
          borrowedAt: new Date("2026-01-01"),
          returnedAt: new Date("2026-01-11"),
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-11"),
        },
      ])
      .mockResolvedValueOnce([
        {
          borrowedAt: new Date("2026-01-15"),
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-1",
          returnedAt: new Date("2026-01-20"),
          updatedAt: new Date("2026-01-20"),
          item: { name: "Drill" },
          requester: { name: "Alex", email: "alex@example.com" },
          itemOwner: { name: "Sam", email: "sam@example.com" },
        },
      ]);
    prismaMock.communityMembership.groupBy.mockResolvedValue([
      { communityId: "c-1", _count: { id: 2 } },
      { communityId: "c-2", _count: { id: 8 } },
    ]);
    prismaMock.community.findMany.mockResolvedValue([
      { id: "c-1", name: "Small Group", isArchived: false },
      { id: "c-2", name: "Big Group", isArchived: false },
    ]);
    prismaMock.lendingRequest.groupBy.mockResolvedValue([
      { status: "RETURNED", _count: { id: 8 } },
      { status: "BORROWED", _count: { id: 2 } },
    ]);
    prismaMock.item.groupBy.mockResolvedValue([
      { category: "tool", _count: { id: 12 } },
      { category: null, _count: { id: 8 } },
    ]);
  });

  it("returns overview and community metrics", async () => {
    const analytics = await getPlatformAnalytics();

    expect(analytics.overview.totalUsers).toBe(10);
    expect(analytics.overview.completedTrades).toBe(8);
    expect(analytics.overview.currentlyBorrowed).toBe(2);
    expect(analytics.overview.borrowUtilization).toBe(10);
    expect(analytics.communities.averageSize).toBe(5);
    expect(analytics.communities.smallest).toEqual({
      communityId: "c-1",
      name: "Small Group",
      population: 2,
      isArchived: false,
    });
    expect(analytics.communities.largest).toEqual({
      communityId: "c-2",
      name: "Big Group",
      population: 8,
      isArchived: false,
    });
    expect(analytics.lending.averageCompletedBorrowDays).toBe(10);
    expect(analytics.items.byCategory).toEqual([
      { category: "tool", count: 12 },
      { category: "Uncategorized", count: 8 },
    ]);
    expect(analytics.recentTrades).toHaveLength(1);
  });
});
