import { prisma } from "~/db.server";

export type NotificationType =
  | "COMMUNITY_APPROVED"
  | "COMMUNITY_REJECTED"
  | "LENDING_REQUEST"
  | "LENDING_APPROVED"
  | "LENDING_REJECTED"
  | "ITEM_BORROWED"
  | "ITEM_RETURNED";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
    },
  });
}

export async function getUserNotifications({
  userId,
  limit = 50,
}: {
  userId: string;
  limit?: number;
}) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount({ userId }: { userId: string }) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function markNotificationAsRead({
  notificationId,
  userId,
}: {
  notificationId: string;
  userId: string;
}) {
  // Ensure the notification belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Response("Notification not found", { status: 404 });
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead({ userId }: { userId: string }) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}

export async function deleteNotification({
  notificationId,
  userId,
}: {
  notificationId: string;
  userId: string;
}) {
  // Ensure the notification belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Response("Notification not found", { status: 404 });
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}
