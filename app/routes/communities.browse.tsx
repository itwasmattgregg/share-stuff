import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  getListedCommunities,
  requestToJoinCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communities = await getListedCommunities({ userId });
  return json({ communities, userId });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const communityId = formData.get("communityId");

  if (typeof communityId !== "string") {
    throw new Response("Invalid request", { status: 400 });
  }

  await requestToJoinCommunity({ userId, communityId });
  return redirect(`/communities/browse`);
};

export default function BrowseCommunitiesPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
          Discover Communities
        </h2>
        <p className="mt-1 text-sm sm:text-base text-neutral-600">
          Find a community to join.
        </p>
      </div>

      {data.communities.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg">
          <p className="text-neutral-500 mb-2">No listed communities yet.</p>
          <p className="text-sm text-neutral-400 mb-6">
            Be the first to create one!
          </p>
          <Link
            to="/communities/new"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            Create a Community
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.communities.map((community) => {
            const membership = community.memberships[0];
            const isOwner = community.owner.id === data.userId;
            const isMember = isOwner || membership?.status === "APPROVED";
            const isPending = !isOwner && membership?.status === "PENDING";

            return (
              <div
                key={community.id}
                className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900 leading-tight">
                    {community.name}
                  </h3>
                  {(isMember || isOwner) && (
                    <span className="flex-shrink-0 inline-flex rounded-full bg-success-100 px-2 py-1 text-xs font-medium text-success-800">
                      Member
                    </span>
                  )}
                  {isPending && (
                    <span className="flex-shrink-0 inline-flex rounded-full bg-warning-100 px-2 py-1 text-xs font-medium text-warning-800">
                      Pending
                    </span>
                  )}
                </div>

                {community.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-3 flex-1">
                    {community.description}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    {community._count.memberships}{" "}
                    {community._count.memberships === 1 ? "member" : "members"}
                  </span>

                  {isMember ? (
                    <Link
                      to={`/communities/${community.id}`}
                      className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white font-medium hover:bg-primary-600 shadow-sm transition-colors"
                    >
                      View Community
                    </Link>
                  ) : isPending ? (
                    <span className="text-sm text-neutral-500 italic">
                      Awaiting approval
                    </span>
                  ) : (
                    <Form method="post">
                      <input
                        type="hidden"
                        name="communityId"
                        value={community.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-secondary-500 px-4 py-2 text-sm text-white font-medium hover:bg-secondary-600 shadow-sm transition-colors"
                      >
                        Request to Join
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
