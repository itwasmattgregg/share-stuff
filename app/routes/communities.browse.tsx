import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  getCommunities,
  requestToJoinCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const communities = await getCommunities();
  return json({ communities });
};

export const action = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const communityId = formData.get("communityId");

  if (typeof communityId !== "string") {
    return json({ error: "Invalid community" }, { status: 400 });
  }

  await requestToJoinCommunity({ userId, communityId });
  return json({ success: true });
};

export default function BrowseCommunitiesPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="text-2xl font-bold">Browse Communities</h2>
      <p className="mt-2 text-gray-600">
        Discover communities where you can share and borrow items.
      </p>

      {data.communities.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-gray-500">No communities available yet.</p>
          <Link
            to="/communities/new"
            className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create the first community
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.communities.map((community) => (
            <div
              key={community.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{community.name}</h3>
              <p className="mt-2 text-gray-600">
                {community.description || "No description available"}
              </p>

              <div className="mt-4 text-sm text-gray-500">
                <p>Owner: {community.owner.name || community.owner.email}</p>
                <p>Members: {community._count.memberships}</p>
                <p>Items: {community._count.items}</p>
              </div>

              {community.rules && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Rules:</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {community.rules}
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <Form method="post">
                  <input
                    type="hidden"
                    name="communityId"
                    value={community.id}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                  >
                    Request to Join
                  </button>
                </Form>
                <Link
                  to={`/report?type=community&id=${community.id}`}
                  className="block w-full rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 text-center"
                >
                  Report Community
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
