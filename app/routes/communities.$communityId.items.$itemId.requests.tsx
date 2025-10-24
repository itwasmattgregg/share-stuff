import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { getItem, updateLendingRequestStatus } from "~/models/item.server";
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

  // Only the item owner can view requests
  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({ item });
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const formData = await request.formData();
  const requestId = formData.get("requestId");
  const status = formData.get("status");
  const responseNote = formData.get("responseNote");

  if (typeof requestId !== "string" || typeof status !== "string") {
    throw new Response("Invalid request", { status: 400 });
  }

  await updateLendingRequestStatus({
    requestId,
    status: status as "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED",
    responseNote: typeof responseNote === "string" ? responseNote : undefined,
  });

  return redirect(
    `/communities/${params.communityId}/items/${itemId}/requests`
  );
};

export default function ItemRequestsPage() {
  const data = useLoaderData<typeof loader>();

  const pendingRequests = data.item.lendingRequests.filter(
    (request) => request.status === "PENDING"
  );
  const approvedRequests = data.item.lendingRequests.filter(
    (request) => request.status === "APPROVED"
  );
  const borrowedRequests = data.item.lendingRequests.filter(
    (request) => request.status === "BORROWED"
  );
  const completedRequests = data.item.lendingRequests.filter(
    (request) => request.status === "RETURNED" || request.status === "REJECTED"
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Lending Requests</h2>
        <p className="mt-2 text-gray-600">
          Manage requests for "{data.item.name}"
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.requester.name || request.requester.email}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Requested on{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.requestNote && (
                      <p className="mt-2 text-sm text-gray-700">
                        "{request.requestNote}"
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button
                        type="submit"
                        className="rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
                      >
                        Approve
                      </button>
                    </Form>
                    <Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button
                        type="submit"
                        className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
                        onClick={(e) => {
                          if (
                            !confirm(
                              "Are you sure you want to reject this request?"
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Reject
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currently Borrowed */}
      {borrowedRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Currently Borrowed</h3>
          <div className="space-y-4">
            {borrowedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-blue-200 bg-blue-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.requester.name || request.requester.email}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Borrowed on{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.requestNote && (
                      <p className="mt-2 text-sm text-gray-700">
                        "{request.requestNote}"
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <input type="hidden" name="status" value="RETURNED" />
                      <button
                        type="submit"
                        className="rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
                        onClick={(e) => {
                          if (!confirm("Mark this item as returned?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Mark as Returned
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved but not yet borrowed */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Approved (Ready for Pickup)
          </h3>
          <div className="space-y-4">
            {approvedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-green-200 bg-green-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.requester.name || request.requester.email}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Approved on{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.requestNote && (
                      <p className="mt-2 text-sm text-gray-700">
                        "{request.requestNote}"
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <input type="hidden" name="status" value="BORROWED" />
                      <button
                        type="submit"
                        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                      >
                        Mark as Borrowed
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Completed Requests</h3>
          <div className="space-y-4">
            {completedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.requester.name || request.requester.email}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {request.status === "RETURNED" ? "Returned" : "Rejected"}{" "}
                      on {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.requestNote && (
                      <p className="mt-2 text-sm text-gray-700">
                        "{request.requestNote}"
                      </p>
                    )}
                    {request.responseNote && (
                      <p className="mt-2 text-sm text-gray-700">
                        <strong>Your response:</strong> "{request.responseNote}"
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      request.status === "RETURNED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.item.lendingRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No lending requests for this item yet.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Link
          to={`/communities/${data.item.community.id}/items/${data.item.id}`}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Back to Item
        </Link>
      </div>
    </div>
  );
}
