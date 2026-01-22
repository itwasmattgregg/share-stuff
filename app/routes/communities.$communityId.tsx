import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import {
  getCommunity,
  isUserMemberOfCommunity,
  isUserOwnerOfCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const community = await getCommunity({ id: communityId });

  if (!community) {
    throw new Response("Community not found", { status: 404 });
  }

  const isMember = await isUserMemberOfCommunity({ userId, communityId });
  const isOwner = await isUserOwnerOfCommunity({ userId, communityId });

  return json({ community, isMember, isOwner });
};

export default function CommunityPage() {
  const data = useLoaderData<typeof loader>();

  if (!data.isMember) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h2>
        <p className="mt-4 text-neutral-600 mb-6">
          You are not a member of this community. Communities are private and only accessible to members.
        </p>
        <Link
          to="/communities"
          className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
        >
          Back to My Communities
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">{data.community.name}</h2>
          {data.community.description && (
            <p className="mt-2 text-neutral-600">{data.community.description}</p>
          )}

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Link
              to="items"
              className="rounded-lg bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
            >
              Browse Items
            </Link>
            <Link
              to="items/new"
              className="rounded-lg bg-secondary-500 px-4 py-2 text-white font-medium hover:bg-secondary-600 shadow-md transition-colors"
            >
              Add Item
            </Link>
            {data.isOwner && (
              <Link
                to="manage"
                className="rounded-lg bg-accent-500 px-4 py-2 text-white font-medium hover:bg-accent-600 shadow-md transition-colors"
              >
                Manage Community
              </Link>
            )}
          </div>
        </div>
      </div>

      <div>
        <Outlet />
      </div>
    </>
  );
}
