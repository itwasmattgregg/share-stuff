import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import {
  getCommunity,
  isUserMemberOfCommunity,
  isUserOwnerOfCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ params, request }: LoaderArgs) => {
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
  const user = useUser();

  if (!data.isMember) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-4 text-gray-600">
          You are not a member of this community. Request to join to access its
          content.
        </p>
        <Link
          to="/communities/browse"
          className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Browse Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-gray-50 p-4">
        <h2 className="text-2xl font-bold">{data.community.name}</h2>
        {data.community.description && (
          <p className="mt-2 text-gray-600">{data.community.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4">
          <Link
            to="items"
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Browse Items
          </Link>
          <Link
            to="items/new"
            className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Add Item
          </Link>
          {data.isOwner && (
            <Link
              to="manage"
              className="rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
            >
              Manage Community
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}
