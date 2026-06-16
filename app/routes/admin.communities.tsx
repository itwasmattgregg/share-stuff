import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/models/admin.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await requireAdmin({ userId });

  const communities = await prisma.community.findMany({
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ communities });
};

export default function AdminCommunitiesPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Community Management
        </h1>
        <p className="text-gray-600">
          Monitor and manage communities across the platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.communities.length === 0 ? (
          <p className="text-gray-500">No communities found.</p>
        ) : (
          data.communities.map((community) => (
            <div
              key={community.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {community.name}
              </h3>
              {community.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {community.description}
                </p>
              )}
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Owner:</strong> {community.owner.name || community.owner.email}
                </div>
                <div>
                  <strong>Members:</strong> {community._count.memberships}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {new Date(community.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to={`/communities/${community.id}`}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  View Community →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
