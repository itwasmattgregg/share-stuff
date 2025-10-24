import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getItem } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  // Check if user owns this item
  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({ item });
};

export default function ItemDetailPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.item.name}</h2>
          <p className="text-gray-600">by {data.item.owner.name || data.item.owner.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/items/${data.item.id}/edit`}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Edit
          </Link>
          <Link
            to="."
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to Items
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Item Details</h3>
            
            {data.item.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">Description</h4>
                <p className="mt-1 text-gray-900">{data.item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {data.item.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Category</h4>
                  <p className="mt-1 text-gray-900">{data.item.category}</p>
                </div>
              )}
              {data.item.condition && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Condition</h4>
                  <p className="mt-1 text-gray-900">{data.item.condition}</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Status</h4>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  data.item.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.item.isAvailable ? "Available" : "Borrowed"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Lending Requests</h3>
            
            {data.item.lendingRequests.length === 0 ? (
              <p className="text-gray-500">No requests yet.</p>
            ) : (
              <div className="space-y-3">
                {data.item.lendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {request.requester.name || request.requester.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : request.status === "BORROWED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    {request.requestNote && (
                      <p className="mt-2 text-sm text-gray-600">
                        {request.requestNote}
                      </p>
                    )}
                    {request.responseNote && (
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Your response:</strong> {request.responseNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
