import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

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

  const items = await getCommunityItems({ communityId, search });
  return json({ items, search, communityId, userId });
};

export default function CommunityIndexPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Community Items</h2>
        <p className="mt-2 text-neutral-600">
          Items shared by community members. To add your own items, go to <Link to="/items" className="text-primary-600 hover:text-primary-800">My Items</Link>.
        </p>
        
        {/* Search Form */}
        <div className="mt-4">
          <Form method="get" className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search items by name, description, or category..."
              defaultValue={data.search || ""}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
            >
              Search
            </button>
            {data.search && (
              <Link
                to="."
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 shadow-md transition-colors"
              >
                Clear
              </Link>
            )}
          </Form>
        </div>
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
              <p className="text-sm text-neutral-400">
                Community members can share their items by adding them to their personal collection.
              </p>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <ItemPhoto
                itemId={item.id}
                photoKey={item.photoKey}
                alt={item.name}
                className="mb-4 h-40 w-full rounded-lg border border-neutral-200 object-cover"
              />

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
                        <span className="inline-flex items-center rounded-full bg-warning-100 px-2 py-1 text-warning-800">
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
                        <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-1 text-success-800">
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

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  to={`/items/${item.id}`}
                  className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-primary-500 px-3 py-2 text-sm text-white font-medium hover:bg-primary-600 shadow-md transition-colors min-h-[44px]"
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
                  className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium shadow-md transition-colors min-h-[44px]"
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
