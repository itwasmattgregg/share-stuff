import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import { requestPasswordReset } from "~/models/password.server";
import { getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  const url = new URL(request.url);
  const redirectTo = safeRedirect(
    url.searchParams.get("redirectTo"),
    "/communities"
  );

  if (userId) {
    return redirect(redirectTo);
  }

  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid" }, submitted: false },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  await requestPasswordReset({ email, origin });

  return json({ submitted: true, errors: null });
};

export const meta: MetaFunction = () => [{ title: "Forgot Password" }];

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
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

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {actionData?.submitted ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            If an account exists for that email, a password reset link has been
            sent. Check your inbox.
          </div>
        ) : (
          <Form method="post" className="space-y-6">
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
                  autoFocus
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={actionData?.errors?.email ? true : undefined}
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
                {actionData?.errors?.email ? (
                  <div className="pt-1 text-red-700">
                    {actionData.errors.email}
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              Send reset link
            </button>
          </Form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            className="text-blue-500 underline"
            to={{
              pathname: "/login",
              search: searchParams.toString(),
            }}
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
