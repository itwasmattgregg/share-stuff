import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";

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

  return null;
};

export default function VerifyEmailLayout() {
  return <Outlet />;
}
