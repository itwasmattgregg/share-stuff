import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import type { User } from "~/models/user.server";
import { getUserById } from "~/models/user.server";
import type { FlashMessage } from "~/utils/flash";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";
const SESSION_EXPIRY_KEY = "expiresAt";
const FLASH_KEY = "flash";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

type Session = Awaited<ReturnType<typeof getSession>>;

/**
 * A cookie session carries its lifetime in the Set-Cookie header rather than in
 * the session data, so re-committing without the original `maxAge` would
 * silently downgrade a remembered login to a browser-session cookie. We record
 * the intended expiry alongside the user id and restore it on every commit.
 */
async function commitSession(session: Session) {
  const expiresAt = session.get(SESSION_EXPIRY_KEY);

  if (typeof expiresAt !== "number") {
    return sessionStorage.commitSession(session);
  }

  const remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);

  return sessionStorage.commitSession(
    session,
    remainingSeconds > 0 ? { maxAge: remainingSeconds } : {}
  );
}

/**
 * Reads and clears a pending flash message. The caller must send the returned
 * header, otherwise the message stays in the cookie and shows up again.
 */
export async function takeFlashMessage(request: Request): Promise<{
  flashMessage: FlashMessage | null;
  headers?: { "Set-Cookie": string };
}> {
  const session = await getSession(request);
  const flashMessage = (session.get(FLASH_KEY) as FlashMessage | undefined) ?? null;

  if (!flashMessage) {
    return { flashMessage: null };
  }

  return {
    flashMessage,
    headers: { "Set-Cookie": await commitSession(session) },
  };
}

/**
 * Redirects while queueing a one-shot message for the destination page.
 */
export async function redirectWithFlash(
  request: Request,
  to: string,
  flashMessage: FlashMessage
) {
  const session = await getSession(request);
  session.flash(FLASH_KEY, flashMessage);

  return redirect(to, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);

  const maxAge = remember
    ? 60 * 60 * 24 * 7 // 7 days
    : undefined;

  if (maxAge) {
    session.set(SESSION_EXPIRY_KEY, Date.now() + maxAge * 1000);
  } else {
    session.unset(SESSION_EXPIRY_KEY);
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, { maxAge }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
