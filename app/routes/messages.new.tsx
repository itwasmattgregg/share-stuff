import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import Layout from "~/components/Layout";
import { getUserCommunities } from "~/models/community.server";
import {
  getOrCreateConversation,
  getCommunityMembersForMessaging,
} from "~/models/message.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communities = await getUserCommunities({ userId });

  // Get members for each community
  const communitiesWithMembers = await Promise.all(
    communities.map(async (community) => {
      const members = await getCommunityMembersForMessaging({
        communityId: community.id,
        userId,
      });
      return {
        ...community,
        members,
      };
    })
  );

  return json({ communities: communitiesWithMembers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const otherUserId = formData.get("otherUserId");
  const communityId = formData.get("communityId");

  if (typeof otherUserId !== "string" || typeof communityId !== "string") {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  if (otherUserId === userId) {
    return json({ error: "Cannot start conversation with yourself" }, { status: 400 });
  }

  try {
    const conversation = await getOrCreateConversation({
      userId1: userId,
      userId2: otherUserId,
      communityId,
    });

    return redirect(`/messages/${conversation.id}`);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to create conversation",
      },
      { status: 400 }
    );
  }
};

export default function NewConversationPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(
    data.communities[0]?.id || ""
  );

  const selectedCommunity = data.communities.find((c) => c.id === selectedCommunityId);

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/messages"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Messages
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Start Conversation</h1>
          <p className="mt-2 text-neutral-600">
            Select a community and choose a member to message.
          </p>
        </div>
      </div>

      {actionData?.error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{actionData.error}</p>
        </div>
      )}

      {data.communities.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-lg mb-2">No communities available.</p>
          <p className="text-neutral-400 text-sm mb-4">
            You need to be a member of a community to start conversations.
          </p>
          <Link
            to="/communities"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            My Communities
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="mb-6">
            <label
              htmlFor="community"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Select Community
            </label>
            <select
              id="community"
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {data.communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCommunity && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Members in {selectedCommunity.name}
              </h2>
              {selectedCommunity.members.length === 0 ? (
                <p className="text-neutral-500">
                  No other members in this community yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedCommunity.members.map((member) => (
                    <Form key={member.id} method="post" className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">
                          {member.name || member.email}
                        </p>
                        {member.name && (
                          <p className="text-sm text-neutral-500">{member.email}</p>
                        )}
                      </div>
                      <input type="hidden" name="otherUserId" value={member.id} />
                      <input type="hidden" name="communityId" value={selectedCommunity.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
                      >
                        Message
                      </button>
                    </Form>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
