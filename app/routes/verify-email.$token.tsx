import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import {
  getEmailVerificationToken,
  isEmailVerificationTokenValid,
  verifyEmailWithToken,
} from "~/models/email-verification.server";
import { createUserSession } from "~/session.server";
import { safeRedirect } from "~/utils";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const redirectTo = safeRedirect(
    url.searchParams.get("redirectTo"),
    "/communities"
  );

  const verificationToken = await getEmailVerificationToken({ token });

  if (!verificationToken || !isEmailVerificationTokenValid(verificationToken)) {
    return json({ valid: false as const });
  }

  try {
    const user = await verifyEmailWithToken({ token });

    return createUserSession({
      request,
      userId: user.id,
      remember: false,
      redirectTo,
    });
  } catch {
    return json({ valid: false as const });
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

  return null;
}
