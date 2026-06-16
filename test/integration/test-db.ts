import { execSync } from "node:child_process";

import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";

import { prisma } from "~/db.server";
import { createCommunity } from "~/models/community.server";
import { createUser } from "~/models/user.server";
import { sessionStorage } from "~/session.server";

let migrated = false;

export async function ensureTestDatabase() {
  if (!migrated) {
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: process.env,
    });
    migrated = true;
  }

  await resetDatabase();
}

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.lendingRequest.deleteMany(),
    prisma.item.deleteMany(),
    prisma.communityInvite.deleteMany(),
    prisma.communityMembership.deleteMany(),
    prisma.community.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.password.deleteMany(),
    prisma.report.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function createVerifiedUser({
  email,
  name,
  password = "password123",
}: {
  email: string;
  name?: string;
  password?: string;
}) {
  const user = await createUser(email, password, name);

  return prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
}

export async function createUnverifiedUser({
  email,
  name,
  password = "password123",
}: {
  email: string;
  name?: string;
  password?: string;
}) {
  return createUser(email, password, name);
}

export async function createFormPost(
  url: string,
  fields: Record<string, string>
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return new Request(url, {
    method: "POST",
    body: formData,
  });
}

export async function createCommunityWithOwner({
  ownerId,
  name = "Test Community",
}: {
  ownerId: string;
  name?: string;
}) {
  return createCommunity({
    name,
    description: "A community for integration tests",
    ownerId,
  });
}

export async function addApprovedCommunityMember({
  communityId,
  userId,
}: {
  communityId: string;
  userId: string;
}) {
  return prisma.communityMembership.create({
    data: {
      communityId,
      userId,
      status: "APPROVED",
    },
  });
}

export async function createUserSessionCookie(userId: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return sessionStorage.commitSession(session);
}

export async function createAuthenticatedRequest(
  userId: string,
  url: string,
  init: RequestInit = {}
) {
  const cookie = await createUserSessionCookie(userId);
  const headers = new Headers(init.headers);
  headers.set("Cookie", cookie);

  return new Request(url, {
    ...init,
    headers,
  });
}

export async function createAuthenticatedFormPost(
  userId: string,
  url: string,
  fields: Record<string, string>
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return createAuthenticatedRequest(userId, url, {
    method: "POST",
    body: formData,
  });
}

type RouteHandlerResult = {
  response: Response;
  thrown: boolean;
};

export async function invokeRouteHandler(
  handler: LoaderFunction | ActionFunction,
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<RouteHandlerResult> {
  try {
    const response = await handler(args);

    if (response instanceof Response) {
      return { response, thrown: false };
    }

    throw new Error("Route handler did not return a Response");
  } catch (error) {
    if (error instanceof Response) {
      return { response: error, thrown: true };
    }

    throw error;
  }
}

export async function readJsonResponse<T>(response: Response) {
  return (await response.json()) as T;
}

export { prisma };
