import type { User } from "@prisma/client";

import { prisma } from "~/db.server";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export async function isAdmin({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export async function isSuperAdmin({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "SUPER_ADMIN";
}

export async function requireAdmin({ userId }: { userId: string }) {
  const isUserAdmin = await isAdmin({ userId });

  if (!isUserAdmin) {
    throw new Response("Unauthorized - Admin access required", { status: 403 });
  }

  return true;
}

export async function requireSuperAdmin({ userId }: { userId: string }) {
  const isUserSuperAdmin = await isSuperAdmin({ userId });

  if (!isUserSuperAdmin) {
    throw new Response("Unauthorized - Super Admin access required", {
      status: 403,
    });
  }

  return true;
}


export async function promoteToAdmin({ userId }: { userId: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });
}

export async function promoteToSuperAdmin({ userId }: { userId: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: "SUPER_ADMIN" },
  });
}

export async function demoteToUser({ userId }: { userId: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: "USER" },
  });
}


