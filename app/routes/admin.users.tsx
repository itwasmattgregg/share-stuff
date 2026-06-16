import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  requireAdmin,
  requireSuperAdmin,
  isSuperAdmin,
  promoteToAdmin,
  promoteToSuperAdmin,
  demoteToUser,
} from "~/models/admin.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const [users, canManageSuperAdmins] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedCommunities: true,
            items: true,
            lendingRequests: true,
            communityMemberships: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    isSuperAdmin({ userId }),
  ]);

  return json({ users, canManageSuperAdmins });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const formData = await request.formData();
  const action = formData.get("action");
  const targetUserId = formData.get("userId");

  if (typeof targetUserId !== "string") {
    return json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (action === "promote") {
    await promoteToAdmin({ userId: targetUserId });
  } else if (action === "promote-super") {
    await requireSuperAdmin({ userId });
    await promoteToSuperAdmin({ userId: targetUserId });
  } else if (action === "demote") {
    await demoteToUser({ userId: targetUserId });
  }

  return redirect("/admin/users");
};

export default function AdminUsersPage() {
  const { users, canManageSuperAdmins } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          User Management
        </h1>
        <p className="text-gray-600">
          View and manage platform users and their roles.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
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
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || "No name set"}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-danger-100 text-danger-800"
                        : user.role === "ADMIN"
                        ? "bg-primary-100 text-primary-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>Communities: {user._count.ownedCommunities}</div>
                    <div>Items: {user._count.items}</div>
                    <div>Memberships: {user._count.communityMemberships}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.role === "USER" ? (
                    <Form method="post" className="inline">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="action" value="promote" />
                      <button
                        type="submit"
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Promote to Admin
                      </button>
                    </Form>
                  ) : user.role === "ADMIN" ? (
                    <div className="space-x-3">
                      {canManageSuperAdmins ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="action"
                            value="promote-super"
                          />
                          <button
                            type="submit"
                            className="text-secondary-600 hover:text-secondary-900"
                          >
                            Promote to Super Admin
                          </button>
                        </Form>
                      ) : null}
                      <Form method="post" className="inline">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="demote" />
                        <button
                          type="submit"
                          className="text-danger-600 hover:text-danger-900"
                        >
                          Demote to User
                        </button>
                      </Form>
                    </div>
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
  );
}
