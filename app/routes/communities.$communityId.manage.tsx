import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  getCommunity,
  getPendingMemberships,
  updateMembershipStatus,
  isUserOwnerOfCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const isOwner = await isUserOwnerOfCommunity({ userId, communityId });

  if (!isOwner) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const [community, pendingMemberships] = await Promise.all([
    getCommunity({ id: communityId }),
    getPendingMemberships({ communityId }),
  ]);

  if (!community) {
    throw new Response("Community not found", { status: 404 });
  }

  return json({ community, pendingMemberships });
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const isOwner = await isUserOwnerOfCommunity({ userId, communityId });

  if (!isOwner) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const membershipId = formData.get("membershipId");
  const status = formData.get("status");

  if (typeof membershipId !== "string" || typeof status !== "string") {
    throw new Response("Invalid request", { status: 400 });
  }

  await updateMembershipStatus({
    membershipId,
    status: status as "APPROVED" | "REJECTED",
  });

  return redirect(`/communities/${communityId}/manage`);
};

export default function CommunityManagePage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manage Community</h2>
        <p className="mt-2 text-gray-600">
          Manage "{data.community.name}" - approve members and view community
          details.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Community Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Community Information</h3>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Name</h4>
                <p className="text-gray-600">{data.community.name}</p>
              </div>
              {data.community.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-gray-600">{data.community.description}</p>
                </div>
              )}
              {data.community.rules && (
                <div>
                  <h4 className="font-medium">Rules</h4>
                  <p className="text-gray-600">{data.community.rules}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium">Statistics</h4>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Members:</span>
                    <span className="ml-2 font-medium">
                      {data.community.memberships.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <span className="ml-2 font-medium">
                      {data.community.items.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Memberships */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Pending Membership Requests
          </h3>
          {data.pendingMemberships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending membership requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.pendingMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {membership.user.name || membership.user.email}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Requested on{" "}
                        {new Date(membership.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <Form method="post" className="inline">
                        <input
                          type="hidden"
                          name="membershipId"
                          value={membership.id}
                        />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-md bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                        >
                          Approve
                        </button>
                      </Form>
                      <Form method="post" className="inline">
                        <input
                          type="hidden"
                          name="membershipId"
                          value={membership.id}
                        />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button
                          type="submit"
                          className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                          onClick={(e) => {
                            if (
                              !confirm(
                                "Are you sure you want to reject this membership request?"
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Reject
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Members */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Current Members</h3>
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.community.memberships.map((membership) => (
                  <tr key={membership.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {membership.user.name || membership.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          membership.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : membership.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {membership.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(membership.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to={`/communities/${data.community.id}`}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Back to Community
        </Link>
      </div>
    </div>
  );
}
