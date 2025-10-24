import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";

import { getCommunityItems } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;

  const items = await getCommunityItems({ communityId, search });
  return json({ items, search });
};

export default function CommunityItemsPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Community Items</h2>
        <p className="mt-2 text-gray-600">
          Items shared by community members. To add your own items, go to <Link to="/items" className="text-blue-600 hover:text-blue-800">My Items</Link>.
        </p>
        
        {/* Search Form */}
        <div className="mt-4">
          <Form method="get" className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search items by name, description, or category..."
              defaultValue={data.search || ""}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              Search
            </button>
            {data.search && (
              <Link
                to="."
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
              <p className="text-gray-500 mb-4">No items found matching "{data.search}".</p>
              <p className="text-sm text-gray-400">
                Try searching with different keywords or <Link to="." className="text-blue-600 hover:text-blue-800">clear the search</Link> to see all items.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No items shared by community members yet.</p>
              <p className="text-sm text-gray-400">
                Community members can share their items by adding them to their personal collection.
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          {data.search && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found {data.items.length} item{data.items.length !== 1 ? 's' : ''} matching "{data.search}"
              </p>
              <Link
                to="."
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Show all items
              </Link>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">
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
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {item.category && (
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {item.category}
                  </span>
                )}
                {item.condition && (
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                    {item.condition}
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/items/${item.id}`}
                  className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-center text-sm text-white hover:bg-blue-600"
                >
                  View Details
                </Link>
                <Link
                  to={`/items/${item.id}/request`}
                  className={`flex-1 rounded-md px-3 py-2 text-center text-sm text-white hover:opacity-90 ${
                    item.isAvailable
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {item.isAvailable ? "Request" : "Join Queue"}
                </Link>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
