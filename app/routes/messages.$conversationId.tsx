import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import Layout from "~/components/Layout";
import {
  getConversation,
  sendMessage,
  markMessagesAsRead,
} from "~/models/message.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const conversationId = params.conversationId;

  if (!conversationId) {
    throw new Response("Conversation not found", { status: 404 });
  }

  const conversation = await getConversation({ conversationId, userId });

  if (!conversation) {
    throw new Response("Conversation not found", { status: 404 });
  }

  // Mark messages as read when viewing
  await markMessagesAsRead({ conversationId, userId });

  return json({ conversation });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const conversationId = params.conversationId;
  const formData = await request.formData();
  const content = formData.get("content");

  if (!conversationId) {
    return json({ error: "Conversation not found" }, { status: 404 });
  }

  if (typeof content !== "string" || !content.trim()) {
    return json({ error: "Message content is required" }, { status: 400 });
  }

  try {
    await sendMessage({ conversationId, senderId: userId, content });
    return redirect(`/messages/${conversationId}`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 400 }
    );
  }
};

export default function ConversationPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.conversation.messages]);

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/messages"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Messages
        </Link>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {data.conversation.otherUser.name || data.conversation.otherUser.email}
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Community: {data.conversation.community.name}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="border-t border-neutral-200 pt-4 mb-6">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {data.conversation.messages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                data.conversation.messages.map((message) => {
                  const isOwnMessage = message.senderId !== data.conversation.otherUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? "bg-primary-500 text-white"
                            : "bg-neutral-100 text-neutral-900"
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.sender.name || message.sender.email}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? "text-primary-100" : "text-neutral-500"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error message */}
          {actionData?.error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          )}

          {/* Send message form */}
          <Form method="post" className="border-t border-neutral-200 pt-4">
            <div className="flex gap-3">
              <textarea
                name="content"
                rows={3}
                required
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                className="rounded-lg bg-primary-500 px-6 py-2 text-white font-medium hover:bg-primary-600 shadow-md transition-colors self-end"
              >
                Send
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
