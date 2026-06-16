import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin, getAllAdmins } from "~/models/admin.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);

  // Check if user is an admin
  await requireAdmin({ userId });

  const admins = await getAllAdmins();

  return json({ admins });
};

export default function AdminDashboardPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage the Share Stuff platform and community.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Reports Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            📋 Reports Management
          </h2>
          <p className="text-gray-600 mb-4">
            Review and manage community guideline violations.
          </p>
          <Link
            to="/admin/reports"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Manage Reports
          </Link>
        </div>

        {/* User Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            👥 User Management
          </h2>
          <p className="text-gray-600 mb-4">
            View and manage platform users and their roles.
          </p>
          <Link
            to="/admin/users"
            className="inline-block bg-success-600 text-white px-4 py-2 rounded hover:bg-success-700"
          >
            Manage Users
          </Link>
        </div>

        {/* Community Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🏘️ Community Management
          </h2>
          <p className="text-gray-600 mb-4">
            Monitor and manage communities across the platform.
          </p>
          <Link
            to="/admin/communities"
            className="inline-block bg-secondary-500 text-white px-4 py-2 rounded hover:bg-secondary-700"
          >
            Manage Communities
          </Link>
        </div>

        {/* System Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            📊 System Statistics
          </h2>
          <p className="text-gray-600 mb-4">
            View platform usage and activity statistics.
          </p>
          <Link
            to="/admin/stats"
            className="inline-block bg-warning-500 text-white px-4 py-2 rounded hover:bg-warning-700"
          >
            View Statistics
          </Link>
        </div>

        {/* Admin Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🔑 Admin Management
          </h2>
          <p className="text-gray-600 mb-4">
            Manage admin roles and permissions.
          </p>
          <Link
            to="/admin/admins"
            className="inline-block bg-danger-600 text-white px-4 py-2 rounded hover:bg-danger-700"
          >
            Manage Admins
          </Link>
        </div>

        {/* System Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            ⚙️ System Settings
          </h2>
          <p className="text-gray-600 mb-4">
            Configure platform settings and preferences.
          </p>
          <Link
            to="/admin/settings"
            className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            System Settings
          </Link>
        </div>
      </div>

      {/* Current Admins */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Current Admins
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admin.name || "No name set"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        admin.role === "SUPER_ADMIN"
                          ? "bg-danger-100 text-danger-800"
                          : "bg-primary-100 text-primary-800"
                      }`}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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


