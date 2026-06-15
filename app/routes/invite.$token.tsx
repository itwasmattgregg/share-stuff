import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import {
  getCommunityInviteByToken,
  isCommunityInviteValid,
  joinCommunityViaInvite,
} from "~/models/community-invite.server";
import { getUserId } from "~/session.server";
import { formatLendingRequestDateTime } from "~/utils";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Invite not found", { status: 404 });
  }

  const invite = await getCommunityInviteByToken({ token });

  if (!invite || !isCommunityInviteValid(invite)) {
    return json({
      status: "invalid" as const,
    });
  }

  if (invite.community.isArchived) {
    return json({
      status: "archived" as const,
      communityName: invite.community.name,
    });
  }

  const userId = await getUserId(request);
  const invitePath = `/invite/${token}`;

  if (!userId) {
    return json({
      status: "needs-auth" as const,
      community: invite.community,
      expiresAt: invite.expiresAt.toISOString(),
      invitePath,
    });
  }

  await joinCommunityViaInvite({
    userId,
    communityId: invite.communityId,
  });

  throw redirect(`/communities/${invite.communityId}`);
};

export default function CommunityInvitePage() {
  const data = useLoaderData<typeof loader>();

  if (data.status === "invalid") {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          Invite link expired or invalid
        </h1>
        <p className="mt-4 text-neutral-600">
          This invite link may have expired or already been used. Ask a community
          member to send you a new link.
        </p>
        <Link
          to="/communities"
          className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600"
        >
          Go to Communities
        </Link>
      </div>
    );
  }

  if (data.status === "archived") {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          {data.communityName} has been archived
        </h1>
        <p className="mt-4 text-neutral-600">
          This community is no longer accepting new members.
        </p>
        <Link
          to="/communities"
          className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600"
        >
          Go to Communities
        </Link>
      </div>
    );
  }

  const loginUrl = `/login?${new URLSearchParams({
    redirectTo: data.invitePath,
  }).toString()}`;
  const joinUrl = `/join?${new URLSearchParams({
    redirectTo: data.invitePath,
  }).toString()}`;

  return (
    <div className="mx-auto max-w-lg py-16 px-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">
          Join {data.community.name}
        </h1>
        {data.community.description && (
          <p className="mt-3 text-neutral-600">{data.community.description}</p>
        )}
        <p className="mt-4 text-sm text-neutral-500">
          You&apos;ve been invited to join this community. Log in or create an
          account to continue.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          This invite link expires on{" "}
          {formatLendingRequestDateTime(data.expiresAt)}.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={loginUrl}
            className="flex-1 rounded-lg bg-primary-500 px-4 py-3 text-center text-white font-medium hover:bg-primary-600"
          >
            Log in
          </Link>
          <Link
            to={joinUrl}
            className="flex-1 rounded-lg border border-primary-500 px-4 py-3 text-center text-primary-600 font-medium hover:bg-primary-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
