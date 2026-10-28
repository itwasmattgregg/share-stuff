import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useRef } from "react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import { joinCommunityFromInviteRedirect } from "~/models/community-invite.server";
import { sendEmailVerification } from "~/models/email-verification.server";
import { createUser, getUserByEmail } from "~/models/user.server";
import { getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";
import { submitButtonClassName, useIsSubmitting } from "~/utils/form-submission";
import { getClientIp, verifyTurnstileToken } from "~/utils/turnstile.server";

const SIGNUP_TURNSTILE_ACTION = "signup";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onJoinTurnstileLoad?: () => void;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  const url = new URL(request.url);
  const redirectTo = safeRedirect(
    url.searchParams.get("redirectTo"),
    "/communities"
  );
  if (userId) return redirect(redirectTo);
  return json({
    turnstileSitekey: process.env.TURNSTILE_SITEKEY ?? "",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/communities");
  const turnstileToken = formData.get("cf-turnstile-response");

  const turnstileOk = await verifyTurnstileToken({
    token: turnstileToken,
    remoteip: getClientIp(request),
    expectedAction: SIGNUP_TURNSTILE_ACTION,
  });
  if (!turnstileOk) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          turnstile: "Verification failed. Please try again.",
        },
      },
      { status: 403 }
    );
  }

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid", password: null, turnstile: null } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      {
        errors: {
          email: null,
          password: "Password is required",
          turnstile: null,
        },
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      {
        errors: {
          email: null,
          password: "Password is too short",
          turnstile: null,
        },
      },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          email: "A user already exists with this email",
          password: null,
          turnstile: null,
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser(
    email,
    password,
    typeof name === "string" ? name : undefined
  );

  const communityId = await joinCommunityFromInviteRedirect({
    userId: user.id,
    redirectTo,
  });

  const origin = new URL(request.url).origin;
  await sendEmailVerification({ userId: user.id, origin });

  return json({
    submitted: true,
    email,
    communityJoined: Boolean(communityId),
    errors: null,
  });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
  const { turnstileSitekey } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/communities";
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  useEffect(() => {
    if (!turnstileSitekey || !turnstileRef.current) return;

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSitekey,
        action: SIGNUP_TURNSTILE_ACTION,
      });
    };

    window.onJoinTurnstileLoad = renderWidget;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-join="1"]'
    );
    if (window.turnstile) {
      renderWidget();
    } else if (!existing) {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onJoinTurnstileLoad&render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileJoin = "1";
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      delete window.onJoinTurnstileLoad;
    };
  }, [turnstileSitekey]);

  useEffect(() => {
    if (!actionData?.errors) return;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <div className="mb-8 flex justify-center">
          <Link to="/" aria-label="ShareStuff home">
            <ShareStuffLogo />
          </Link>
        </div>

        {actionData && "submitted" in actionData && actionData.submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm text-success-800">
              We sent a verification link to{" "}
              <span className="font-medium">{actionData.email}</span>. Click the
              link in that email to finish creating your account.
              {actionData.communityJoined ? (
                <>
                  {" "}
                  Once verified, the community you were invited to will appear
                  in My Communities.
                </>
              ) : null}
            </div>
            <p className="text-center text-sm text-gray-500">
              Didn&apos;t get it?{" "}
              <Link
                className="text-primary-600 underline"
                to={{
                  pathname: "/verify-email",
                  search: `email=${encodeURIComponent(actionData.email)}`,
                }}
              >
                Resend verification email
              </Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              <Link
                className="text-primary-600 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Back to login
              </Link>
            </p>
          </div>
        ) : (
          <Form method="post" className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Display Name
              </label>
              <div className="mt-1">
                <input
                  ref={nameRef}
                  id="name"
                  required
                  autoFocus={true}
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  ref={emailRef}
                  id="email"
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={actionData?.errors?.email ? true : undefined}
                  aria-describedby="email-error"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
                {actionData?.errors?.email ? (
                  <div className="pt-1 text-danger-700" id="email-error">
                    {actionData.errors.email}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={actionData?.errors?.password ? true : undefined}
                  aria-describedby="password-error"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
                {actionData?.errors?.password ? (
                  <div className="pt-1 text-danger-700" id="password-error">
                    {actionData.errors.password}
                  </div>
                ) : null}
              </div>
            </div>

            {turnstileSitekey ? (
              <div>
                <div ref={turnstileRef} />
                {actionData?.errors?.turnstile ? (
                  <div className="pt-1 text-danger-700" id="turnstile-error">
                    {actionData.errors.turnstile}
                  </div>
                ) : null}
              </div>
            ) : null}

            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              disabled={isSubmitting}
              className={submitButtonClassName(
                "w-full rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:bg-primary-500"
              )}
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  className="text-primary-600 underline"
                  to={{
                    pathname: "/login",
                    search: searchParams.toString(),
                  }}
                >
                  Log in
                </Link>
              </div>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
