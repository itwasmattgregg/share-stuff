import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

import { createCommunityInvite } from "~/models/community-invite.server";
import {
  getCommunity,
  isCommunityArchived,
  isUserMemberOfCommunity,
  isUserOwnerOfCommunity,
} from "~/models/community.server";
import { requireUserId } from "~/session.server";
import { formatLendingRequestDateTime } from "~/utils";

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

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const isMember = await isUserMemberOfCommunity({ userId, communityId });

  if (!isMember) {
    throw new Response("Unauthorized", { status: 403 });
  }

  if (await isCommunityArchived({ id: communityId })) {
    throw new Response("This community has been archived", { status: 400 });
  }

  const invite = await createCommunityInvite({
    communityId,
    createdById: userId,
  });

  const origin = new URL(request.url).origin;

  return json({
    inviteUrl: `${origin}/invite/${invite.token}`,
    expiresAt: invite.expiresAt.toISOString(),
  });
};

export default function CommunityPage() {
  const data = useLoaderData<typeof loader>();
  const shareFetcher = useFetcher<typeof action>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  if (!data.isMember) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          {data.community.isArchived ? "Community Archived" : "Access Denied"}
        </h2>
        <p className="mt-4 text-neutral-600 mb-6">
          {data.community.isArchived
            ? "This community has been archived and is no longer accepting members."
            : "You are not a member of this community. Communities are private and only accessible to members."}
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

  if (data.community.isArchived) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
        <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
          Archived
        </span>
        <h2 className="mt-4 text-2xl font-bold text-neutral-900">
          {data.community.name}
        </h2>
        <p className="mt-4 text-neutral-600 mb-6">
          This community has been archived. Item sharing and invite links are
          paused until the owner restores it.
        </p>
        {data.isOwner ? (
          <Link
            to="manage"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            Manage Community
          </Link>
        ) : (
          <Link
            to="/communities"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            Back to My Communities
          </Link>
        )}
      </div>
    );
  }

  const shareData = shareFetcher.data;

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
              to="/items/new"
              className="rounded-lg bg-secondary-500 px-4 py-2 text-white font-medium hover:bg-secondary-600 shadow-md transition-colors"
            >
              Add Item
            </Link>
            <shareFetcher.Form method="post">
              <button
                type="submit"
                disabled={shareFetcher.state !== "idle"}
                className="rounded-lg bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600 shadow-md transition-colors disabled:opacity-60"
              >
                {shareFetcher.state !== "idle" ? "Generating..." : "Share Invite Link"}
              </button>
            </shareFetcher.Form>
            {data.isOwner && (
              <Link
                to="manage"
                className="rounded-lg bg-accent-500 px-4 py-2 text-white font-medium hover:bg-accent-600 shadow-md transition-colors"
              >
                Manage Community
              </Link>
            )}
          </div>

          {shareData && (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
              <p className="text-sm font-medium text-primary-900">
                Share this link to invite someone to the community
              </p>
              <p className="mt-1 text-sm text-primary-800">
                This link expires in 5 days (on{" "}
                {formatLendingRequestDateTime(shareData.expiresAt)}). Each time
                you click Share, a new link is generated.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={shareData.inviteUrl}
                  className="flex-1 rounded-md border border-primary-200 bg-white px-3 py-2 text-sm text-neutral-800"
                  onFocus={(event) => event.target.select()}
                />
                <button
                  type="button"
                  className="rounded-md bg-primary-500 px-4 py-2 text-sm text-white font-medium hover:bg-primary-600"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareData.inviteUrl);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Outlet />
      </div>
    </>
  );
}
