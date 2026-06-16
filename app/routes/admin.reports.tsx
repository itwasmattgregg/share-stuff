import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import {
  enrichReportsWithTargets,
  getAllReports,
  updateReportStatus,
} from "~/models/report.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
] as const;

type ReportStatus = "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

function statusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-warning-100 text-warning-800";
    case "UNDER_REVIEW":
      return "bg-primary-100 text-primary-800";
    case "RESOLVED":
      return "bg-success-100 text-success-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") ?? "ALL";

  const reports = await getAllReports(
    statusFilter !== "ALL" ? { status: statusFilter as ReportStatus } : {}
  );
  const enrichedReports = await enrichReportsWithTargets(reports);

  const statusCountRows = await prisma.report.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const statusCounts = (
    ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const
  ).map((status) => ({
    status,
    count:
      statusCountRows.find((entry) => entry.status === status)?._count.id ?? 0,
  }));

  return json({
    reports: enrichedReports,
    statusFilter,
    statusCounts,
    totalReports: statusCounts.reduce((sum, entry) => sum + entry.count, 0),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const formData = await request.formData();
  const reportId = formData.get("reportId");
  const status = formData.get("status");

  if (typeof reportId !== "string" || typeof status !== "string") {
    return json({ error: "Invalid form submission" }, { status: 400 });
  }

  const allowedStatuses: ReportStatus[] = [
    "PENDING",
    "UNDER_REVIEW",
    "RESOLVED",
    "DISMISSED",
  ];

  if (!allowedStatuses.includes(status as ReportStatus)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  await updateReportStatus({
    id: reportId,
    status: status as ReportStatus,
  });

  const redirectTo = formData.get("redirectTo");
  return redirect(
    typeof redirectTo === "string" && redirectTo.startsWith("/admin/reports")
      ? redirectTo
      : "/admin/reports"
  );
};

export default function AdminReportsPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentFilter = data.statusFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reports
        </h1>
        <p className="text-gray-600">
          Review all reports submitted by users across the platform.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((status) => {
          const count =
            status === "ALL"
              ? data.totalReports
              : data.statusCounts.find((entry) => entry.status === status)
                  ?.count ?? 0;

          const params = new URLSearchParams(searchParams);
          if (status === "ALL") {
            params.delete("status");
          } else {
            params.set("status", status);
          }

          const isActive = currentFilter === status;

          return (
            <Link
              key={status}
              to={`/admin/reports?${params.toString()}`}
              className={`rounded-full px-4 py-2 text-sm font-medium border ${
                isActive
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {status === "ALL" ? "All" : status.replace("_", " ")}{" "}
              <span className="opacity-80">({count})</span>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {data.reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reports match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type / Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.reports.map((report) => (
                  <tr key={report.id} className="align-top">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-gray-900">
                        {report.reporter.name || "No name"}
                      </div>
                      <div className="text-gray-500">{report.reporter.email}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-gray-900">
                        {report.reportType}
                      </div>
                      <div className="text-gray-500">{report.targetLabel}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">
                      <div className="font-medium">{report.reason}</div>
                      <p className="text-gray-500 mt-1 line-clamp-3">
                        {report.description}
                      </p>
                      {report.evidence ? (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          Evidence: {report.evidence}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(
                          report.status
                        )}`}
                      >
                        {report.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        {report.status !== "UNDER_REVIEW" ? (
                          <Form method="post">
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="status" value="UNDER_REVIEW" />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/admin/reports?${searchParams.toString()}`}
                            />
                            <button
                              type="submit"
                              className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 w-full"
                            >
                              Under Review
                            </button>
                          </Form>
                        ) : null}
                        {report.status !== "RESOLVED" ? (
                          <Form method="post">
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="status" value="RESOLVED" />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/admin/reports?${searchParams.toString()}`}
                            />
                            <button
                              type="submit"
                              className="text-xs bg-success-500 text-white px-3 py-1 rounded hover:bg-success-700 w-full"
                            >
                              Resolve
                            </button>
                          </Form>
                        ) : null}
                        {report.status !== "DISMISSED" ? (
                          <Form method="post">
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="status" value="DISMISSED" />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/admin/reports?${searchParams.toString()}`}
                            />
                            <button
                              type="submit"
                              className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 w-full"
                            >
                              Dismiss
                            </button>
                          </Form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
