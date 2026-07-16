import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import Layout from "~/components/Layout";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return null;
};

export default function TagsLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
