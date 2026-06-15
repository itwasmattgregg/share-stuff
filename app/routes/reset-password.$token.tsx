import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";

import ShareStuffLogo from "~/components/ShareStuffLogo";
import {
  getPasswordResetToken,
  isPasswordResetTokenValid,
  resetPasswordWithToken,
} from "~/models/password.server";
import { createUserSession, getUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Not found", { status: 404 });
  }

  const userId = await getUserId(request);
  if (userId) {
    return redirect("/profile");
  }

  const resetToken = await getPasswordResetToken({ token });

  if (!resetToken || !isPasswordResetTokenValid(resetToken)) {
    return json({ valid: false as const });
  }

  return json({
    valid: true as const,
    email: resetToken.user.email,
    token,
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const token = params.token;

  if (!token) {
    throw new Response("Not found", { status: 404 });
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || typeof confirmPassword !== "string") {
    return json(
      { errors: { form: "Invalid submission", confirmPassword: null } },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json(
      { errors: { form: null, confirmPassword: "Passwords do not match" } },
      { status: 400 }
    );
  }

  try {
    const user = await resetPasswordWithToken({ token, password });

    return createUserSession({
      request,
      userId: user.id,
      remember: false,
      redirectTo: "/profile",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password";

    return json(
      { errors: { form: message, confirmPassword: null } },
      { status: 400 }
    );
  }
};

export const meta: MetaFunction = () => [{ title: "Reset Password" }];

export default function ResetPasswordPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
            Reset link expired
          </h1>
          <p className="mt-4 text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block text-blue-500 underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <div className="mb-8 flex justify-center">
          <Link to="/" aria-label="ShareStuff home">
            <ShareStuffLogo />
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose a new password for {data.email}.
          </p>
        </div>

        <Form method="post" className="space-y-6">
          {actionData?.errors?.form ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {actionData.errors.form}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={
                actionData?.errors?.confirmPassword ? true : undefined
              }
              className="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {actionData?.errors?.confirmPassword ? (
              <div className="pt-1 text-red-700">
                {actionData.errors.confirmPassword}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Update password
          </button>
        </Form>
      </div>
    </div>
  );
}
