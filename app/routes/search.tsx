import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import Layout from "~/components/Layout";
import CommunityItemRequestLink from "~/components/CommunityItemRequestLink";
import TagPills from "~/components/TagPills";
import { searchItemsInUserCommunities } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const items = await searchItemsInUserCommunities({ userId, search });

  return json({ items, search, userId });
};

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Search</h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          Search items across all communities you belong to.
        </p>

        <Form method="get" className="mt-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search items by name, description, or category..."
            defaultValue={data.search || ""}
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-base focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none rounded-lg bg-primary-500 px-6 py-3 text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors min-h-[44px]"
            >
              Search
            </button>
            {data.search && (
              <Link
                to="/search"
                className="flex-1 sm:flex-none rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base text-neutral-700 hover:bg-neutral-50 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center"
              >
                Clear
              </Link>
            )}
          </div>
        </Form>
      </div>

      {!data.search ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500 text-lg">
            Enter a search term to find items across your communities.
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">
            No items found matching &quot;{data.search}&quot;.
          </p>
          <p className="text-sm text-neutral-400">
            Try searching with different keywords or{" "}
            <Link to="/search" className="text-primary-600 hover:text-primary-800">
              clear the search
            </Link>
            .
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Found {data.items.length} item{data.items.length !== 1 ? "s" : ""}{" "}
              matching &quot;{data.search}&quot;
            </p>
            <Link
              to="/search"
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Clear search
            </Link>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      by {item.owner.name || item.owner.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.visibleCommunities.map((community) => (
                        <span
                          key={community.id}
                          className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                        >
                          {community.name}
                        </span>
                      ))}
                    </div>

                    {item.lendingRequests.length > 0 && (
                      <div className="mt-2 flex gap-2 text-xs">
                        {item.lendingRequests.filter(
                          (request) => request.status === "PENDING"
                        ).length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-warning-100 px-2 py-1 text-warning-800">
                            {
                              item.lendingRequests.filter(
                                (request) => request.status === "PENDING"
                              ).length
                            }{" "}
                            in queue
                          </span>
                        )}
                        {item.lendingRequests.filter(
                          (request) => request.status === "APPROVED"
                        ).length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-1 text-success-800">
                            {
                              item.lendingRequests.filter(
                                (request) => request.status === "APPROVED"
                              ).length
                            }{" "}
                            ready
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        item.isAvailable
                          ? "bg-success-100 text-success-800"
                          : "bg-danger-100 text-danger-800"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Borrowed"}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-2 text-sm text-neutral-600">{item.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.category && (
                    <span className="inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs text-primary-800">
                      {item.category}
                    </span>
                  )}
                  {item.condition && (
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-800">
                      {item.condition}
                    </span>
                  )}
                </div>

                <TagPills
                  tags={item.itemTags.map((itemTag) => itemTag.tag)}
                  className="mt-3"
                />

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/communities/${item.primaryCommunityId}/items/${item.id}`}
                    className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-primary-500 px-4 py-3 text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors min-h-[44px]"
                  >
                    View Details
                  </Link>
                  <CommunityItemRequestLink
                    itemId={item.id}
                    communityId={item.primaryCommunityId}
                    ownerId={item.ownerId}
                    userId={data.userId}
                    isAvailable={item.isAvailable}
                    lendingRequests={item.lendingRequests}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
