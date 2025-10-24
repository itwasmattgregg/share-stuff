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
  reportType,
  targetId,
  reason,
  description,
  evidence,
  reporterId,
}: {
  reportType: "USER" | "COMMUNITY";
  targetId: string;
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

export async function getAllReports() {
  return prisma.report.findMany({
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