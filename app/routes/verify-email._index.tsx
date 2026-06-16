import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import { requestEmailVerification } from "~/models/email-verification.server";
import { validateEmail } from "~/utils";

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
  await requestEmailVerification({ email, origin });

  return json({ submitted: true, errors: null });
};

export const meta: MetaFunction = () => [{ title: "Verify Email" }];

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const prefilledEmail = searchParams.get("email") ?? "";

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
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send you a new verification link.
          </p>
        </div>

        {actionData?.submitted ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            If an unverified account exists for that email, a verification link
            has been sent. Check your inbox.
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
                  defaultValue={prefilledEmail}
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
              Send verification link
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
