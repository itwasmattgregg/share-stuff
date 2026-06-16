import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });
  return null;
};

export default function AdminLayout() {
  return <Outlet />;
}
