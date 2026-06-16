import { prisma } from "~/db.server";

export async function getReportsByStatus({ status }: { status: string }) {
  return prisma.report.findMany({
    where: {
      status: status as any,
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getReportById({ id }: { id: string }) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createReport({
  reportType = "GENERAL",
  targetId = "unspecified",
  reason,
  description,
  evidence,
  reporterId,
}: {
  reportType?: string;
  targetId?: string;
  reason: string;
  description: string;
  evidence?: string;
  reporterId: string;
}) {
  return prisma.report.create({
    data: {
      reportType,
      targetId,
      reason,
      description,
      evidence,
      reporterId,
    },
  });
}

export async function updateReportStatus({
  id,
  status,
}: {
  id: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
}) {
  return prisma.report.update({
    where: { id },
    data: { status },
  });
}

export async function getAllReports({
  status,
}: {
  status?: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
} = {}) {
  return prisma.report.findMany({
    where: status ? { status } : undefined,
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function enrichReportsWithTargets<
  T extends { reportType: string; targetId: string }
>(reports: T[]) {
  const userIds = new Set<string>();
  const communityIds = new Set<string>();

  for (const report of reports) {
    if (report.reportType === "USER" && report.targetId !== "unspecified") {
      userIds.add(report.targetId);
    }

    if (
      report.reportType === "COMMUNITY" &&
      report.targetId !== "unspecified"
    ) {
      communityIds.add(report.targetId);
    }
  }

  const [users, communities] = await Promise.all([
    userIds.size > 0
      ? prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, name: true, email: true },
        })
      : [],
    communityIds.size > 0
      ? prisma.community.findMany({
          where: { id: { in: [...communityIds] } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const communityById = new Map(
    communities.map((community) => [community.id, community])
  );

  return reports.map((report) => {
    let targetLabel = report.targetId;

    if (report.reportType === "USER") {
      const user = userById.get(report.targetId);
      targetLabel = user ? user.name || user.email : report.targetId;
    } else if (report.reportType === "COMMUNITY") {
      const community = communityById.get(report.targetId);
      targetLabel = community ? community.name : report.targetId;
    } else if (report.targetId === "unspecified") {
      targetLabel = "Not specified";
    }

    return {
      ...report,
      targetLabel,
    };
  });
}