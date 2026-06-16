import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { formatDays, getPlatformAnalytics } from "~/models/analytics.server";
import { requireAdmin } from "~/models/admin.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const analytics = await getPlatformAnalytics();

  return json({ analytics });
};

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
      {detail ? (
        <div className="text-xs text-gray-400 mt-2">{detail}</div>
      ) : null}
    </div>
  );
}

export default function AdminStatsPage() {
  const { analytics } = useLoaderData<typeof loader>();
  const { overview, communities, lending, items } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">
          Platform usage, lending activity, and community health metrics.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={overview.totalUsers} />
          <StatCard
            label="Communities"
            value={overview.totalCommunities}
            detail={`${overview.activeCommunities} active`}
          />
          <StatCard label="Items Listed" value={overview.totalItems} />
          <StatCard
            label="Completed Trades"
            value={overview.completedTrades}
            detail="Items borrowed and returned"
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Lending Activity
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Currently Borrowed"
            value={overview.currentlyBorrowed}
            detail={`${overview.unavailableItems} items unavailable`}
          />
          <StatCard
            label="Borrow Utilization"
            value={`${overview.borrowUtilization.toFixed(1)}%`}
            detail={`${overview.currentlyBorrowed} of ${overview.totalItems} items`}
          />
          <StatCard
            label="Avg. Borrow Duration"
            value={formatDays(lending.averageCompletedBorrowDays)}
            detail="Completed borrows with tracked dates"
          />
          <StatCard
            label="Avg. Active Borrow"
            value={formatDays(lending.averageActiveBorrowDays)}
            detail="Currently out on loan"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <StatCard
            label="Pending Requests"
            value={overview.pendingRequests}
          />
          <StatCard
            label="Approved (Awaiting Pickup)"
            value={overview.approvedAwaitingPickup}
          />
          <StatCard
            label="Trade Completion Rate"
            value={`${lending.tradeCompletionRate.toFixed(1)}%`}
            detail="Returned vs. active/approved"
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Communities
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Average Community Size"
            value={communities.averageSize.toFixed(1)}
            detail="Approved members per community"
          />
          <StatCard
            label="Smallest Community"
            value={communities.smallest?.population ?? "—"}
            detail={communities.smallest?.name ?? "No active communities"}
          />
          <StatCard
            label="Largest Community"
            value={communities.largest?.population ?? "—"}
            detail={communities.largest?.name ?? "No active communities"}
          />
          <StatCard
            label="Communities With Members"
            value={communities.totalWithMembers}
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Reports &amp; Inventory
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Reports" value={overview.totalReports} />
          <StatCard
            label="Pending Reports"
            value={overview.pendingReports}
          />
          <StatCard
            label="Available Items"
            value={overview.availableItems}
            detail={`${overview.totalItems - overview.availableItems} unavailable`}
          />
          <StatCard
            label="Item Categories"
            value={items.byCategory.length}
            detail="Distinct categories in use"
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 mb-10">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Lending Requests by Status
          </h2>
          {lending.statusCounts.length === 0 ? (
            <p className="text-gray-500">No lending activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {lending.statusCounts.map((entry) => (
                <li
                  key={entry.status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-700">
                    {entry.status}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Items by Category
          </h2>
          {items.byCategory.length === 0 ? (
            <p className="text-gray-500">No items listed yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.byCategory.map((entry) => (
                <li
                  key={entry.category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-700">
                    {entry.category}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Completed Trades
        </h2>
        {analytics.recentTrades.length === 0 ? (
          <p className="text-gray-500">No completed trades yet.</p>
        ) : (
          <ul className="space-y-4">
            {analytics.recentTrades.map((trade) => (
              <li key={trade.id} className="text-sm border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="font-medium text-gray-900">{trade.item.name}</div>
                <div className="text-gray-600">
                  {trade.requester.name || trade.requester.email} borrowed from{" "}
                  {trade.itemOwner.name || trade.itemOwner.email}
                </div>
                {trade.returnedAt ? (
                  <div className="text-xs text-gray-400">
                    Returned {new Date(trade.returnedAt).toLocaleDateString()}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
