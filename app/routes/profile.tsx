import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { useState } from "react";

import Layout from "~/components/Layout";
import { getUserCommunities } from "~/models/community.server";
import { getUserItems } from "~/models/item.server";
import { requireUserId, logout } from "~/session.server";
import { getUserById, deleteUserByEmail } from "~/models/user.server";
import { changeUserPassword } from "~/models/password.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);

  const [user, communities, items, pendingMemberships] = await Promise.all([
    getUserById(userId),
    getUserCommunities({ userId }),
    getUserItems({ userId }),
    prisma.communityMembership.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    communities,
    items,
    pendingMemberships,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "update-name") {
    const name = formData.get("name");
    if (typeof name === "string") {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() || null },
      });
      return redirect("/profile");
    }
  } else if (action === "change-password") {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return json(
        { passwordError: "Invalid submission" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return json(
        { passwordError: "New passwords do not match" },
        { status: 400 }
      );
    }

    try {
      await changeUserPassword({
        userId,
        currentPassword,
        newPassword,
      });
      return redirect("/profile?passwordUpdated=1");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to change password";
      return json({ passwordError: message }, { status: 400 });
    }
  } else if (action === "delete-account") {
    const confirmEmail = formData.get("confirmEmail");
    const user = await getUserById(userId);
    if (user && confirmEmail === user.email) {
      // Delete user (cascades will handle related data)
      await deleteUserByEmail(user.email);
      // Logout and redirect
      return logout(request);
    } else {
      return json(
        { error: "Email confirmation does not match" },
        { status: 400 }
      );
    }
  }

  return redirect("/profile");
};

export default function ProfilePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const passwordUpdated = searchParams.get("passwordUpdated") === "1";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
        <p className="text-gray-600">Manage your profile and account settings.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profile Information
          </h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="update-name" />
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email (cannot be changed)
              </label>
              <input
                type="email"
                id="email"
                value={data.user.email}
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Display Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={data.user.name || ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p className="text-gray-600">
                {new Date(data.user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 shadow-md transition-colors"
              >
                Update Profile
              </button>
            </div>
          </Form>
        </div>

        {/* Password */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Password</h2>
          {passwordUpdated && (
            <div className="mb-4 rounded-md bg-success-50 p-3 text-sm text-success-800">
              Your password has been updated.
            </div>
          )}
          {actionData && "passwordError" in actionData && actionData.passwordError ? (
            <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-700">
              {actionData.passwordError}
            </div>
          ) : null}
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="change-password" />
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm new password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 shadow-md transition-colors"
              >
                Change Password
              </button>
            </div>
          </Form>
        </div>

        {/* My Communities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            My Communities ({data.communities.length})
          </h2>
          {data.communities.length === 0 ? (
            <p className="text-gray-500">
              You haven't joined any communities yet.{" "}
              <Link to="/communities/new" className="text-primary-600 hover:text-primary-800">
                Create a community
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/communities/${community.id}`}
                  className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-gray-900">{community.name}</h3>
                  {community.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {community.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {community._count.memberships} members
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Join Requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Pending Join Requests ({data.pendingMemberships.length})
          </h2>
          {data.pendingMemberships.length === 0 ? (
            <p className="text-gray-500">No pending join requests.</p>
          ) : (
            <div className="space-y-3">
              {data.pendingMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-4"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {membership.community.name}
                    </h3>
                    {membership.community.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {membership.community.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Requested on {new Date(membership.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-warning-100 px-3 py-1 text-xs font-medium text-warning-800">
                    Pending Approval
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            My Items ({data.items.length})
          </h2>
          {data.items.length === 0 ? (
            <p className="text-gray-500">
              You haven't added any items yet.{" "}
              <Link to="/items/new" className="text-primary-600 hover:text-primary-800">
                Add your first item
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    {item.category && (
                      <span className="inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs text-primary-800">
                        {item.category}
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        item.isAvailable
                          ? "bg-success-100 text-success-800"
                          : "bg-danger-100 text-danger-800"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Borrowed"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {data.items.length > 6 && (
            <div className="mt-4">
              <Link
                to="/items"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View all {data.items.length} items →
              </Link>
            </div>
          )}
        </div>

        {/* Account Deletion */}
        <div className="bg-white border border-danger-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-danger-800 mb-4">
            Danger Zone
          </h2>
          {!showDeleteConfirm ? (
            <div>
              <p className="text-gray-600 mb-4">
                Once you delete your account, there is no going back. All your
                communities, items, and data will be permanently deleted.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
              >
                Delete My Account
              </button>
            </div>
          ) : (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="delete-account" />
              <div>
                <label
                  htmlFor="confirmEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  To confirm, please type your email address:{" "}
                  <span className="font-mono text-gray-900">{data.user.email}</span>
                </label>
                <input
                  type="email"
                  id="confirmEmail"
                  name="confirmEmail"
                  required
                  className="w-full rounded-md border border-danger-300 px-3 py-2"
                  placeholder="Enter your email to confirm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
                >
                  Permanently Delete Account
                </button>
              </div>
            </Form>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
}
