import { prisma } from "~/db.server";

function daysBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function averageDays(durations: number[]) {
  return average(durations);
}

function formatDays(days: number | null) {
  if (days === null) {
    return "—";
  }

  if (days < 1) {
    return "< 1 day";
  }

  return `${days.toFixed(1)} days`;
}

export async function getPlatformAnalytics() {
  const [
    totalUsers,
    totalCommunities,
    activeCommunities,
    totalItems,
    availableItems,
    completedTrades,
    currentlyBorrowed,
    pendingRequests,
    approvedAwaitingPickup,
    totalReports,
    pendingReports,
    returnedRequests,
    activeBorrows,
    membershipCounts,
    communities,
    lendingStatusCounts,
    itemCategoryCounts,
    recentTrades,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.community.count({ where: { isArchived: false } }),
    prisma.item.count(),
    prisma.item.count({ where: { isAvailable: true } }),
    prisma.lendingRequest.count({ where: { status: "RETURNED" } }),
    prisma.lendingRequest.count({ where: { status: "BORROWED" } }),
    prisma.lendingRequest.count({ where: { status: "PENDING" } }),
    prisma.lendingRequest.count({ where: { status: "APPROVED" } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.lendingRequest.findMany({
      where: {
        status: "RETURNED",
        borrowedAt: { not: null },
        returnedAt: { not: null },
      },
      select: {
        borrowedAt: true,
        returnedAt: true,
      },
    }),
    prisma.lendingRequest.findMany({
      where: { status: "BORROWED", borrowedAt: { not: null } },
      select: { borrowedAt: true },
    }),
    prisma.communityMembership.groupBy({
      by: ["communityId"],
      where: { status: "APPROVED" },
      _count: { id: true },
    }),
    prisma.community.findMany({
      select: { id: true, name: true, isArchived: true },
    }),
    prisma.lendingRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.item.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.lendingRequest.findMany({
      where: { status: "RETURNED" },
      take: 5,
      orderBy: { returnedAt: "desc" },
      select: {
        id: true,
        returnedAt: true,
        item: { select: { name: true } },
        requester: { select: { name: true, email: true } },
        itemOwner: { select: { name: true, email: true } },
      },
    }),
  ]);

  const communityNameById = new Map(
    communities.map((community) => [community.id, community.name])
  );

  const populations = membershipCounts.map((entry) => ({
    communityId: entry.communityId,
    name: communityNameById.get(entry.communityId) ?? "Unknown",
    population: entry._count.id,
    isArchived:
      communities.find((community) => community.id === entry.communityId)
        ?.isArchived ?? false,
  }));

  const activePopulations = populations.filter((entry) => !entry.isArchived);
  const populationValues = activePopulations.map((entry) => entry.population);

  const sortedByPopulation = [...activePopulations].sort(
    (a, b) => a.population - b.population
  );

  const completedBorrowDurations = returnedRequests
    .filter(
      (request): request is { borrowedAt: Date; returnedAt: Date } =>
        request.borrowedAt !== null && request.returnedAt !== null
    )
    .map((request) => daysBetween(request.borrowedAt, request.returnedAt));

  const activeBorrowDurations = activeBorrows
    .filter(
      (request): request is { borrowedAt: Date } => request.borrowedAt !== null
    )
    .map((request) => daysBetween(request.borrowedAt, new Date()));

  const borrowUtilization =
    totalItems > 0 ? (currentlyBorrowed / totalItems) * 100 : 0;

  const tradeCompletionRate =
    completedTrades + currentlyBorrowed + approvedAwaitingPickup > 0
      ? (completedTrades /
          (completedTrades + currentlyBorrowed + approvedAwaitingPickup)) *
        100
      : 0;

  return {
    overview: {
      totalUsers,
      totalCommunities,
      activeCommunities,
      totalItems,
      availableItems,
      completedTrades,
      currentlyBorrowed,
      unavailableItems: totalItems - availableItems,
      borrowUtilization,
      pendingRequests,
      approvedAwaitingPickup,
      totalReports,
      pendingReports,
    },
    communities: {
      averageSize: average(populationValues) ?? 0,
      smallest:
        sortedByPopulation.length > 0 ? sortedByPopulation[0] : null,
      largest:
        sortedByPopulation.length > 0
          ? sortedByPopulation[sortedByPopulation.length - 1]
          : null,
      totalWithMembers: activePopulations.length,
    },
    lending: {
      averageCompletedBorrowDays: averageDays(completedBorrowDurations),
      averageActiveBorrowDays: averageDays(activeBorrowDurations),
      tradeCompletionRate,
      statusCounts: lendingStatusCounts.map((entry) => ({
        status: entry.status,
        count: entry._count.id,
      })),
    },
    items: {
      byCategory: itemCategoryCounts.map((entry) => ({
        category: entry.category ?? "Uncategorized",
        count: entry._count.id,
      })),
    },
    recentTrades,
  };
}

export { formatDays };
