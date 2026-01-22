import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";

import Layout from "~/components/Layout";
import { getUserItems } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const items = await getUserItems({ userId });
  return json({ items });
};

export default function ItemsPage() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const isDetailPage = location.pathname !== "/items" && location.pathname !== "/items/" && location.pathname.includes("/items/");

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Items</h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            Manage all your shared items. You have {data.items.length} item{data.items.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          to="new"
          className="rounded-lg bg-primary-500 px-6 py-3 text-base text-white font-medium hover:bg-primary-600 shadow-md transition-colors text-center min-h-[44px] flex items-center justify-center sm:inline-flex"
        >
          + Add Item
        </Link>
      </div>

      {data.items.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-lg mb-2">No items yet.</p>
          <p className="text-neutral-400 text-sm mb-4">
            Start sharing by adding your first item!
          </p>
          <Link
            to="new"
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600 shadow-md transition-colors"
          >
            Add Your First Item
          </Link>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Desktop: Sidebar list */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-neutral-900 mb-3">Items</h2>
              <nav className="space-y-1">
                {data.items.map((item) => {
                  const isActive = location.pathname.includes(`/items/${item.id}`);
                  return (
                    <Link
                      key={item.id}
                      to={item.id}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{item.name}</span>
                        <span
                          className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium flex-shrink-0 ${
                            item.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Borrowed"}
                        </span>
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
              {data.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.id}
                  className="block bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-neutral-900 flex-1">
                      {item.name}
                    </h3>
                    <span
                      className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        item.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Borrowed"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
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