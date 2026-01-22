import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Layout from "~/components/Layout";
import { getConversationsForUser } from "~/models/message.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const conversationsByCommunity = await getConversationsForUser({ userId });
  return json({ conversationsByCommunity });
};

export default function MessagesPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Messages</h1>
          <p className="mt-2 text-neutral-600">
            Chat with other members of your communities.
          </p>
        </div>
        <Link
          to="new"
          className="rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
        >
          + Start Conversation
        </Link>
      </div>

      {data.conversationsByCommunity.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-lg mb-2">No conversations yet.</p>
          <p className="text-neutral-400 text-sm mb-4">
            Start a conversation with someone from your communities!
          </p>
          <Link
            to="new"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            Start Your First Conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {data.conversationsByCommunity.map((group) => (
            <div key={group.community.id} className="bg-white border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <span className="mr-2">🏘️</span>
                {group.community.name}
              </h2>
              <div className="space-y-3">
                {group.conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    to={conversation.id}
                    className="block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-neutral-900">
                            {conversation.otherUser.name || conversation.otherUser.email}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-500 rounded-full">
                              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.latestMessage ? (
                          <p className="text-sm text-neutral-600 truncate">
                            <span className="font-medium">
                              {conversation.latestMessage.senderId === conversation.otherUser.id
                                ? ""
                                : "You: "}
                            </span>
                            {conversation.latestMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-neutral-400 italic">No messages yet</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-xs text-neutral-500">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                        {conversation.latestMessage && (
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(conversation.latestMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
