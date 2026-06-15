import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useNavigate } from "@remix-run/react";

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
  const navigate = useNavigate();

  const isBrowsePage = location.pathname === "/communities/browse";
  const isIndexPage = location.pathname === "/communities" || location.pathname === "/communities/";
  const isDetailPage = !isIndexPage;

  const activeCommunityId = data.communities.find((c) =>
    location.pathname.includes(`/communities/${c.id}`)
  )?.id ?? "";

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
            to="browse"
            className={`rounded-lg border px-5 py-3 text-base font-medium shadow-sm transition-colors text-center min-h-[44px] flex items-center justify-center sm:inline-flex ${
              isBrowsePage
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            Discover
          </Link>
          <Link
            to="new"
            className="rounded-lg bg-primary-500 px-5 py-3 text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center sm:inline-flex"
          >
            + Create
          </Link>
        </div>
      </div>

      {data.communities.length === 0 ? (
        /* No communities — still render outlet so browse page works */
        <Outlet />
      ) : (
        <>
          {/* Mobile: Community selector dropdown (not on browse page) */}
          {!isBrowsePage && (
            <div className="lg:hidden mb-4">
              <label htmlFor="mobile-community-select" className="sr-only">
                Select community
              </label>
              <select
                id="mobile-community-select"
                value={activeCommunityId}
                onChange={(e) => navigate(`/communities/${e.target.value}`)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {data.communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                          {community.isArchived ? " · Archived" : ""}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <Link
                    to="browse"
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      isBrowsePage
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                    }`}
                  >
                    Discover communities →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Mobile: Cards grid - hidden when on detail/browse page */}
            {isIndexPage && (
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
                      {community.isArchived ? " · Archived" : ""}
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

          {/* Mobile: Show outlet when on detail or browse page */}
          {isDetailPage && (
            <div className="lg:hidden">
              <Outlet />
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
