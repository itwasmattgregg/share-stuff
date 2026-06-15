import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const [
    totalUsers,
    totalCommunities,
    totalItems,
    totalLendingRequests,
    totalReports,
    recentUsers,
    recentCommunities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.item.count(),
    prisma.lendingRequest.count(),
    prisma.report.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
    prisma.community.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const userRoleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: {
      id: true,
    },
  });

  return json({
    stats: {
      totalUsers,
      totalCommunities,
      totalItems,
      totalLendingRequests,
      totalReports,
    },
    userRoleCounts,
    recentUsers,
    recentCommunities,
  });
};

export default function AdminStatsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          System Statistics
        </h1>
        <p className="text-gray-600">
          View platform usage and activity statistics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-900">
            {data.stats.totalUsers}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Users</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-900">
            {data.stats.totalCommunities}
          </div>
          <div className="text-sm text-gray-600 mt-1">Communities</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-900">
            {data.stats.totalItems}
          </div>
          <div className="text-sm text-gray-600 mt-1">Items</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-900">
            {data.stats.totalLendingRequests}
          </div>
          <div className="text-sm text-gray-600 mt-1">Lending Requests</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-900">
            {data.stats.totalReports}
          </div>
          <div className="text-sm text-gray-600 mt-1">Reports</div>
        </div>
      </div>

      {/* User Roles */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Users by Role
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.userRoleCounts.map((roleCount) => (
            <div key={roleCount.role} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {roleCount.role}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {roleCount._count.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Users
          </h2>
          {data.recentUsers.length === 0 ? (
            <p className="text-gray-500">No users yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentUsers.map((user) => (
                <li key={user.id} className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user.name || "No name set"}
                  </div>
                  <div className="text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Communities
          </h2>
          {data.recentCommunities.length === 0 ? (
            <p className="text-gray-500">No communities yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentCommunities.map((community) => (
                <li key={community.id} className="text-sm">
                  <div className="font-medium text-gray-900">
                    {community.name}
                  </div>
                  <div className="text-gray-500">
                    by {community.owner.name || community.owner.email}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(community.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
