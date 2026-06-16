import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import {
  getItem,
  notifyLendingRequestStatusChange,
  updateLendingRequestForItemOwner,
} from "~/models/item.server";
import type { LendingStatus } from "~/models/item.server";
import ItemPhoto from "~/components/ItemPhoto";
import { requireUserId } from "~/session.server";
import { formatLendingRequestDateTime } from "~/utils";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({ item });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const formData = await request.formData();
  const requestId = formData.get("requestId");
  const status = formData.get("status");

  if (typeof requestId !== "string" || typeof status !== "string") {
    throw new Response("Invalid request", { status: 400 });
  }

  const lendingRequest = await updateLendingRequestForItemOwner({
    userId,
    itemId,
    requestId,
    status: status as LendingStatus,
  }).catch((error: Error) => {
    if (error.message === "Unauthorized") {
      throw new Response("Unauthorized", { status: 403 });
    }
    if (error.message === "Item not found") {
      throw new Response("Item not found", { status: 404 });
    }
    throw new Response(error.message, { status: 400 });
  });

  await notifyLendingRequestStatusChange({
    lendingRequest,
    status: status as LendingStatus,
    links: {
      requester: `/items/${itemId}`,
      owner: `/items/${itemId}`,
    },
  });

  return redirect(`/items/${itemId}`);
};

export default function ItemDetailPage() {
  const data = useLoaderData<typeof loader>();

  const borrowedRequest = data.item.lendingRequests.find(
    (request) => request.status === "BORROWED"
  );
  const pendingRequests = data.item.lendingRequests.filter(
    (request) => request.status === "PENDING"
  );
  const otherRequests = data.item.lendingRequests.filter(
    (request) =>
      request.status !== "BORROWED" && request.status !== "PENDING"
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.item.name}</h2>
          <p className="text-gray-600">
            by {data.item.owner.name || data.item.owner.email}
          </p>
        </div>
        <div>
          <Link
            to={`/items/${data.item.id}/edit`}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ItemPhoto
            itemId={data.item.id}
            photoKey={data.item.photoKey}
            alt={data.item.name}
            className="h-64 w-full rounded-lg border border-gray-200 object-cover"
          />

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Item Details</h3>

            {data.item.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Description
                </h4>
                <p className="mt-1 text-gray-900">{data.item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {data.item.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Category
                  </h4>
                  <p className="mt-1 text-gray-900">{data.item.category}</p>
                </div>
              )}
              {data.item.condition && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Condition
                  </h4>
                  <p className="mt-1 text-gray-900">{data.item.condition}</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Status</h4>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  data.item.isAvailable
                    ? "bg-success-100 text-success-800"
                    : "bg-danger-100 text-danger-800"
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
              <div className="space-y-4">
                {borrowedRequest && (
                  <div className="rounded-md border border-primary-200 bg-primary-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          Currently borrowed by{" "}
                          {borrowedRequest.requester.name ||
                            borrowedRequest.requester.email}
                        </p>
                        <p className="text-xs text-primary-700">
                          Since{" "}
                          {formatLendingRequestDateTime(
                            borrowedRequest.createdAt
                          )}
                        </p>
                        {borrowedRequest.requestNote && (
                          <p className="mt-2 text-sm text-primary-800">
                            {borrowedRequest.requestNote}
                          </p>
                        )}
                      </div>
                      <Form method="post" className="shrink-0">
                        <input
                          type="hidden"
                          name="requestId"
                          value={borrowedRequest.id}
                        />
                        <input type="hidden" name="status" value="RETURNED" />
                        <button
                          type="submit"
                          className="rounded-md bg-success-500 px-3 py-2 text-sm text-white hover:bg-success-700"
                          onClick={(event) => {
                            if (
                              !confirm(
                                `Mark "${data.item.name}" as returned from ${
                                  borrowedRequest.requester.name ||
                                  borrowedRequest.requester.email
                                }?`
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                        >
                          Mark as Returned
                        </button>
                      </Form>
                    </div>
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Queue ({pendingRequests.length})
                    </h4>
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-md border border-warning-200 bg-warning-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {request.requester.name ||
                                  request.requester.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatLendingRequestDateTime(
                                  request.createdAt
                                )}
                              </p>
                              {request.requestNote && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {request.requestNote}
                                </p>
                              )}
                            </div>
                            <Form method="post" className="shrink-0">
                              <input
                                type="hidden"
                                name="requestId"
                                value={request.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="REJECTED"
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-danger-500 px-3 py-2 text-sm text-white hover:bg-danger-700"
                                onClick={(event) => {
                                  if (
                                    !confirm(
                                      `Reject the request from ${
                                        request.requester.name ||
                                        request.requester.email
                                      }?`
                                    )
                                  ) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                Reject
                              </button>
                            </Form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {otherRequests.length > 0 && (
                  <div className="space-y-3">
                    {otherRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-md border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {request.requester.name ||
                                request.requester.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatLendingRequestDateTime(request.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              request.status === "APPROVED"
                                ? "bg-success-100 text-success-800"
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
                            <strong>Your response:</strong>{" "}
                            {request.responseNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
