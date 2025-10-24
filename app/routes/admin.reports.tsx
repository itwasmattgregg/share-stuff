import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import { getReportsByStatus } from "~/models/report.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);

  // Check if user is an admin
  await requireAdmin({ userId });

  const pendingReports = await getReportsByStatus({ status: "PENDING" });
  const underReviewReports = await getReportsByStatus({
    status: "UNDER_REVIEW",
  });
  const resolvedReports = await getReportsByStatus({ status: "RESOLVED" });
  const dismissedReports = await getReportsByStatus({ status: "DISMISSED" });

  return json({
    pendingReports,
    underReviewReports,
    resolvedReports,
    dismissedReports,
  });
};

export default function AdminReportsPage() {
  const data = useLoaderData<typeof loader>();

  const ReportCard = ({ report }: { report: any }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{report.reportType} Report</h3>
          <p className="text-sm text-gray-600">
            Reported by {report.reporter.name || report.reporter.email}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            report.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800"
              : report.status === "UNDER_REVIEW"
              ? "bg-blue-100 text-blue-800"
              : report.status === "RESOLVED"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Reason</h4>
          <p className="text-sm text-gray-600">{report.reason}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700">Description</h4>
          <p className="text-sm text-gray-600">{report.description}</p>
        </div>

        {report.evidence && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Evidence</h4>
            <p className="text-sm text-gray-600">{report.evidence}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
            Mark Under Review
          </button>
          <button className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
            Resolve
          </button>
          <button className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Report Management
        </h1>
        <p className="text-gray-600">
          Review and manage community guideline violations.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Pending Reports */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Pending Reports ({data.pendingReports.length})
          </h2>
          {data.pendingReports.length === 0 ? (
            <p className="text-gray-500">No pending reports.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.pendingReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        {/* Under Review Reports */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Under Review ({data.underReviewReports.length})
          </h2>
          {data.underReviewReports.length === 0 ? (
            <p className="text-gray-500">No reports under review.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.underReviewReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        {/* Resolved Reports */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Resolved Reports ({data.resolvedReports.length})
          </h2>
          {data.resolvedReports.length === 0 ? (
            <p className="text-gray-500">No resolved reports.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.resolvedReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        {/* Dismissed Reports */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Dismissed Reports ({data.dismissedReports.length})
          </h2>
          {data.dismissedReports.length === 0 ? (
            <p className="text-gray-500">No dismissed reports.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.dismissedReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Link
          to="/communities"
          className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Communities
        </Link>
      </div>
    </div>
  );
}
