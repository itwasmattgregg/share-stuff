import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import {
  getEmailVerificationToken,
  isEmailVerificationTokenValid,
  verifyEmailWithToken,
} from "~/models/email-verification.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Not found", { status: 404 });
  }

  const userId = await getUserId(request);
  const url = new URL(request.url);
  const redirectTo = safeRedirect(
    url.searchParams.get("redirectTo"),
    "/communities"
  );

  if (userId) {
    return redirect(redirectTo);
  }

  const verificationToken = await getEmailVerificationToken({ token });

  if (!verificationToken || !isEmailVerificationTokenValid(verificationToken)) {
    return json({ valid: false as const });
  }

  return json({
    valid: true as const,
    email: verificationToken.user.email,
    token,
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const redirectTo = safeRedirect(
    url.searchParams.get("redirectTo"),
    "/communities"
  );

  try {
    const user = await verifyEmailWithToken({ token });

    return createUserSession({
      request,
      userId: user.id,
      remember: false,
      redirectTo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify email";

    return json({ errors: { form: message } }, { status: 400 });
  }
};

export const meta: MetaFunction = () => [{ title: "Verify Email" }];

export default function VerifyEmailTokenPage() {
  const data = useLoaderData<typeof loader>();

  if (!data.valid) {
    return (
      <div className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-md px-8 text-center">
          <div className="mb-8 flex justify-center">
            <Link to="/" aria-label="ShareStuff home">
              <ShareStuffLogo />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Verification link expired
          </h1>
          <p className="mt-4 text-gray-600">
            This email verification link is invalid or has expired.
          </p>
          <Link
            to="/verify-email"
            className="mt-6 inline-block text-blue-500 underline"
          >
            Request a new verification link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8 text-center">
        <div className="mb-8 flex justify-center">
          <Link to="/" aria-label="ShareStuff home">
            <ShareStuffLogo />
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
        <p className="mt-4 text-gray-600">
          Confirm your email address for {data.email} to finish creating your
          account.
        </p>
        <form method="post" className="mt-6">
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Verify email and continue
          </button>
        </form>
      </div>
    </div>
  );
}
