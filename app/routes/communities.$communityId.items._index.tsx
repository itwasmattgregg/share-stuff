import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";

import { isUserMemberOfCommunity } from "~/models/community.server";
import { getCommunityItems } from "~/models/item.server";
import CommunityItemRequestLink from "~/components/CommunityItemRequestLink";
import ItemPhoto from "~/components/ItemPhoto";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;

  const [items, isMember] = await Promise.all([
    getCommunityItems({ communityId, search }),
    isUserMemberOfCommunity({ userId, communityId }),
  ]);

  return json({ items, search, communityId, isMember, userId });
};

export default function CommunityItemsPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Community Items</h2>
            <p className="mt-1 text-sm sm:text-base text-neutral-600">
              Items shared by community members.
            </p>
          </div>
          {data.isMember && (
            <Link
              to="/items/new"
              className="rounded-lg bg-secondary-500 px-6 py-3 text-base text-white font-medium hover:bg-secondary-600 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center sm:inline-flex sm:w-auto"
            >
              + Add Item
            </Link>
          )}
        </div>

        {/* Search Form */}
        <Form method="get" className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search items..."
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
                to="."
                className="flex-1 sm:flex-none rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base text-neutral-700 hover:bg-neutral-50 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center"
              >
                Clear
              </Link>
            )}
          </div>
        </Form>
      </div>

      {data.items.length === 0 ? (
        <div className="text-center py-12">
          {data.search ? (
            <>
              <p className="text-neutral-500 mb-4">No items found matching "{data.search}".</p>
              <p className="text-sm text-neutral-400">
                Try searching with different keywords or <Link to="." className="text-primary-600 hover:text-primary-800">clear the search</Link> to see all items.
              </p>
            </>
          ) : (
            <>
              <p className="text-neutral-500 mb-4">No items shared by community members yet.</p>
              {data.isMember && (
                <Link
                  to="/items/new"
                  className="inline-block rounded-lg bg-secondary-500 px-6 py-3 text-white font-medium hover:bg-secondary-600 shadow-md transition-colors"
                >
                  Be the first to add an item
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          {data.search && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Found {data.items.length} item{data.items.length !== 1 ? 's' : ''} matching "{data.search}"
              </p>
              <Link
                to="."
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Show all items
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    by {item.owner.name || item.owner.email}
                  </p>

                  {/* Queue information */}
                  {item.lendingRequests.length > 0 && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {item.lendingRequests.filter(
                        (r) => r.status === "PENDING"
                      ).length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-yellow-800">
                          {
                            item.lendingRequests.filter(
                              (r) => r.status === "PENDING"
                            ).length
                          }{" "}
                          in queue
                        </span>
                      )}
                      {item.lendingRequests.filter(
                        (r) => r.status === "APPROVED"
                      ).length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-green-800">
                          {
                            item.lendingRequests.filter(
                              (r) => r.status === "APPROVED"
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
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
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

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  to={`/items/${item.id}`}
                  className="flex-1 rounded-lg bg-primary-500 px-4 py-3 text-center text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors min-h-[44px] flex items-center justify-center"
                >
                  View Details
                </Link>
                <CommunityItemRequestLink
                  itemId={item.id}
                  communityId={data.communityId}
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
    </div>
  );
}
