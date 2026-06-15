import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  requireSuperAdmin,
  getAllAdmins,
  promoteToAdmin,
  promoteToSuperAdmin,
  demoteToUser,
} from "~/models/admin.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireSuperAdmin({ userId });

  const admins = await getAllAdmins();
  const regularUsers = await prisma.user.findMany({
    where: {
      role: "USER",
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return json({ admins, regularUsers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireSuperAdmin({ userId });

  const formData = await request.formData();
  const action = formData.get("action");
  const targetUserId = formData.get("userId");

  if (typeof targetUserId !== "string") {
    return json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (action === "promote-admin") {
    await promoteToAdmin({ userId: targetUserId });
  } else if (action === "promote-super") {
    await promoteToSuperAdmin({ userId: targetUserId });
  } else if (action === "demote") {
    await demoteToUser({ userId: targetUserId });
  }

  return redirect("/admin/admins");
};

export default function AdminAdminsPage() {
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
          Admin Management
        </h1>
        <p className="text-gray-600">
          Manage admin roles and permissions. Only Super Admins can access this
          page.
        </p>
      </div>

      {/* Current Admins */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Current Admins ({data.admins.length})
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {admin.role === "ADMIN" ? (
                      <>
                        <Form method="post" className="inline mr-2">
                          <input type="hidden" name="userId" value={admin.id} />
                          <input type="hidden" name="action" value="promote-super" />
                          <button
                            type="submit"
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Promote to Super Admin
                          </button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="userId" value={admin.id} />
                          <input type="hidden" name="action" value="demote" />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900"
                          >
                            Demote to User
                          </button>
                        </Form>
                      </>
                    ) : (
                      <span className="text-gray-400">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote Users to Admin */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Promote Users to Admin
        </h2>
        {data.regularUsers.length === 0 ? (
          <p className="text-gray-500">No regular users found.</p>
        ) : (
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
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.regularUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name || "No name set"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Form method="post" className="inline mr-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="promote-admin" />
                        <button
                          type="submit"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Promote to Admin
                        </button>
                      </Form>
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
