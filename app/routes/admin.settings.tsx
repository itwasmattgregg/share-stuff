import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  // Placeholder for future settings
  return json({ message: "System settings page - coming soon" });
};

export default function AdminSettingsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          System Settings
        </h1>
        <p className="text-gray-600">
          Configure platform settings and preferences.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <p className="text-gray-600">{data.message}</p>
        <p className="mt-4 text-sm text-gray-500">
          This page will allow configuration of platform-wide settings such as
          maintenance mode, email templates, and feature flags.
        </p>
      </div>
    </div>
  );
}
