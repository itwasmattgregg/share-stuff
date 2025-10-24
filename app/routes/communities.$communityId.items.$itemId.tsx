import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { getItem, deleteItem } from "~/models/item.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

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

  return json({ item });
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  // Only the item owner can delete
  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  await deleteItem({ id: itemId });

  return redirect(`/communities/${item.community.id}/items`);
};

export default function ItemDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();
  const isOwner = data.item.ownerId === user.id;

  // Get current borrower if item is borrowed
  const currentBorrower = data.item.lendingRequests.find(
    (request) => request.status === "BORROWED"
  )?.requester;

  // Get queue of pending requests
  const pendingRequests = data.item.lendingRequests.filter(
    (request) => request.status === "PENDING"
  );

  // Get approved requests (ready for pickup)
  const approvedRequests = data.item.lendingRequests.filter(
    (request) => request.status === "APPROVED"
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.item.name}</h2>
          <div className="flex items-center justify-between">
            <p className="mt-1 text-gray-600">
              by {data.item.owner.name || data.item.owner.email}
            </p>
            {!isOwner && (
              <Link
                to={`/report?type=user&id=${data.item.ownerId}`}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Report User
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              data.item.isAvailable
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {data.item.isAvailable ? "Available" : "Currently Borrowed"}
          </span>
          {isOwner && (
            <Form method="post">
              <button
                type="submit"
                className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to delete this item?")) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </Form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Item Details</h3>

            {data.item.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Description
                </h4>
                <p className="mt-1 text-gray-600">{data.item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.item.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Category
                  </h4>
                  <p className="mt-1 text-gray-600">{data.item.category}</p>
                </div>
              )}
              {data.item.condition && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Condition
                  </h4>
                  <p className="mt-1 text-gray-600">{data.item.condition}</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Queue */}
          {(pendingRequests.length > 0 || approvedRequests.length > 0) && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Current Queue</h3>

              {pendingRequests.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pending Requests ({pendingRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingRequests.map((request, index) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-md border border-yellow-100 bg-yellow-50 p-3"
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-sm font-medium text-yellow-800">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {request.requester.name ||
                                request.requester.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-yellow-600">Waiting</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedRequests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Ready for Pickup ({approvedRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {approvedRequests.map((request, index) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-md border border-green-100 bg-green-50 p-3"
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-sm font-medium text-green-800">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {request.requester.name ||
                                request.requester.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-green-600">Approved</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lending History */}
          {data.item.lendingRequests.length > 0 && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Lending History</h3>
              <div className="space-y-3">
                {data.item.lendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {request.requester.name || request.requester.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {request.requestNote && (
                        <p className="text-sm text-gray-600 mt-1">
                          "{request.requestNote}"
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : request.status === "BORROWED"
                          ? "bg-blue-100 text-blue-800"
                          : request.status === "RETURNED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Current Status</h3>
            {data.item.isAvailable ? (
              <div>
                <p className="text-green-600 font-medium">
                  Available to borrow
                </p>
                {!isOwner && (
                  <Link
                    to={`/communities/${data.item.community.id}/items/${data.item.id}/request`}
                    className="mt-3 block w-full rounded-md bg-green-500 px-4 py-2 text-center text-white hover:bg-green-600"
                  >
                    Request to Borrow
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-medium">Currently borrowed</p>
                {isOwner && currentBorrower && (
                  <p className="mt-2 text-sm text-gray-600">
                    Borrowed by: {currentBorrower.name || currentBorrower.email}
                  </p>
                )}
                {!isOwner && (
                  <p className="mt-2 text-sm text-gray-600">
                    This item is currently being borrowed by another member.
                  </p>
                )}
              </div>
            )}

            {/* Queue Information */}
            {data.item.lendingRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Request Queue
                </h4>
                <div className="space-y-2">
                  {data.item.lendingRequests.filter(
                    (r) => r.status === "PENDING"
                  ).length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600">
                        {
                          data.item.lendingRequests.filter(
                            (r) => r.status === "PENDING"
                          ).length
                        }{" "}
                        pending requests
                      </span>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        In Queue
                      </span>
                    </div>
                  )}
                  {data.item.lendingRequests.filter(
                    (r) => r.status === "APPROVED"
                  ).length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">
                        {
                          data.item.lendingRequests.filter(
                            (r) => r.status === "APPROVED"
                          ).length
                        }{" "}
                        approved, ready for pickup
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
                {!isOwner && (
                  <p className="mt-2 text-xs text-gray-500">
                    You can still request to join the queue even if the item is
                    currently borrowed.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Owner Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/communities/${data.item.community.id}/items/${data.item.id}/edit`}
                  className="block w-full rounded-md bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
                >
                  Edit Item
                </Link>
                <Link
                  to={`/communities/${data.item.community.id}/items/${data.item.id}/requests`}
                  className="block w-full rounded-md bg-purple-500 px-4 py-2 text-center text-white hover:bg-purple-600"
                >
                  View Requests
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
