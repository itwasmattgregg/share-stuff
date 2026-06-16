import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import Layout from "~/components/Layout";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "~/models/notification.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const notifications = await getUserNotifications({ userId });
  return json({ notifications });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const notificationId = formData.get("notificationId");

  if (action === "mark-read" && typeof notificationId === "string") {
    await markNotificationAsRead({ notificationId, userId });
  } else if (action === "mark-all-read") {
    await markAllNotificationsAsRead({ userId });
  } else if (action === "delete" && typeof notificationId === "string") {
    await deleteNotification({ notificationId, userId });
  }

  return redirect("/notifications");
};

export default function NotificationsPage() {
  const data = useLoaderData<typeof loader>();
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">Notifications</h1>
        <p className="text-neutral-600">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All caught up!"}
        </p>
      </div>

      {unreadCount > 0 && (
        <div className="mb-4">
          <Form method="post" className="inline">
            <input type="hidden" name="action" value="mark-all-read" />
            <button
              type="submit"
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 shadow-md transition-colors"
            >
              Mark All as Read
            </button>
          </Form>
        </div>
      )}

      {data.notifications.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-lg">No notifications yet.</p>
          <p className="text-neutral-400 text-sm mt-2">
            You'll see notifications here when there's activity on your communities
            or lending requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 ${
                notification.read
                  ? "bg-neutral-50 border-neutral-200"
                  : "bg-primary-50 border-primary-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      notification.read ? "text-neutral-700" : "text-neutral-900"
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      notification.read ? "text-neutral-600" : "text-neutral-700"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  {!notification.read && (
                    <Form method="post" className="inline">
                      <input type="hidden" name="action" value="mark-read" />
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <button
                        type="submit"
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        Mark Read
                      </button>
                    </Form>
                  )}
                  <Form method="post" className="inline">
                    <input type="hidden" name="action" value="delete" />
                    <input
                      type="hidden"
                      name="notificationId"
                      value={notification.id}
                    />
                    <button
                      type="submit"
                      className="text-xs text-danger-600 hover:text-danger-700"
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              </div>
              {notification.link && (
                <div className="mt-3">
                  <Link
                    to={notification.link}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
