import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";

import Layout from "~/components/Layout";
import { getUserCommunities } from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communities = await getUserCommunities({ userId });
  return json({ communities });
};

export default function CommunitiesPage() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const isDetailPage = location.pathname !== "/communities" && location.pathname !== "/communities/";

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Communities</h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            Your communities and community activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="new"
            className="rounded-lg bg-primary-500 px-6 py-3 text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center sm:inline-flex"
          >
            + Create Community
          </Link>
        </div>
      </div>

      {data.communities.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-lg mb-2">No communities yet.</p>
          <p className="text-neutral-400 text-sm mb-4">
            Create your first community to get started!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="new"
              className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
            >
              Create Community
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Desktop: Sidebar list */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-neutral-900 mb-3">Communities</h2>
              <nav className="space-y-1">
                {data.communities.map((community) => {
                  const isActive = location.pathname.includes(`/communities/${community.id}`);
                  return (
                    <Link
                      key={community.id}
                      to={community.id}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="font-medium">{community.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {community._count.memberships} members
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile: Cards grid - hidden when on detail page */}
          {!isDetailPage && (
            <div className="lg:hidden grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 w-full">
              {data.communities.map((community) => (
                <Link
                  key={community.id}
                  to={community.id}
                  className="block bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {community.name}
                  </h3>
                  {community.description && (
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                      {community.description}
                    </p>
                  )}
                  <div className="text-xs text-neutral-500 mt-3">
                    {community._count.memberships} members
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Content area - Desktop only */}
          <div className="hidden lg:block flex-1">
            <Outlet />
          </div>
        </div>
      )}

      {/* Mobile: Show outlet when on detail page */}
      {isDetailPage && (
        <div className="lg:hidden mt-6">
          <Outlet />
        </div>
      )}
    </Layout>
  );
}
