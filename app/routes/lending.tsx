import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import Layout from "~/components/Layout";
import {
  cancelLendingRequest,
  getLendingRequestsForUser,
  markLendingRequestBorrowed,
  notifyLendingRequestStatusChange,
} from "~/models/item.server";
import { requireUserId } from "~/session.server";
import { formatLendingRequestDateTime } from "~/utils";
import {
  ACTIVE_BORROWER_REQUEST_STATUSES,
  formatDueDate,
  getBorrowerRequestStatusLabel,
  getQueuePositionForUser,
} from "~/utils/lending-request";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const requests = await getLendingRequestsForUser({ userId });
  return json({ requests, userId });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const requestId = formData.get("requestId");
  const intent = formData.get("intent");

  if (typeof requestId !== "string" || typeof intent !== "string") {
    throw new Response("Invalid request", { status: 400 });
  }

  const handleModelError = (error: Error) => {
    if (error.message === "Unauthorized") {
      throw new Response("Unauthorized", { status: 403 });
    }
    throw new Response(error.message, { status: 400 });
  };

  if (intent === "cancel") {
    const lendingRequest = await cancelLendingRequest({
      userId,
      requestId,
    }).catch(handleModelError);

    await notifyLendingRequestStatusChange({
      lendingRequest,
      status: "CANCELLED",
      links: {
        requester: "/lending",
        owner: `/items/${lendingRequest.item.id}`,
      },
    });

    return redirect("/lending");
  }

  if (intent === "mark-picked-up") {
    const lendingRequest = await markLendingRequestBorrowed({
      userId,
      requestId,
    }).catch(handleModelError);

    await notifyLendingRequestStatusChange({
      lendingRequest,
      status: "BORROWED",
      links: {
        requester: "/lending",
        owner: `/items/${lendingRequest.item.id}`,
      },
    });

    return redirect("/lending");
  }

  throw new Response("Invalid request", { status: 400 });
};

const ACTIVE_INCOMING_REQUEST_STATUSES = new Set([
  "BORROWED",
  "APPROVED",
  "PENDING",
]);

const INCOMING_REQUEST_STATUS_ORDER: Record<string, number> = {
  BORROWED: 0,
  APPROVED: 1,
  PENDING: 2,
};

const PAST_BORROWER_REQUEST_STATUSES = new Set([
  "RETURNED",
  "REJECTED",
  "CANCELLED",
]);

export function partitionLendingRequests<
  T extends {
    requesterId: string;
    itemOwnerId: string;
    status: string;
    createdAt: Date | string;
  },
>(requests: T[], userId: string) {
  const requestsForMyItems = requests
    .filter(
      (request) =>
        request.itemOwnerId === userId &&
        ACTIVE_INCOMING_REQUEST_STATUSES.has(request.status)
    )
    .sort((left, right) => {
      const statusOrder =
        (INCOMING_REQUEST_STATUS_ORDER[left.status] ?? 99) -
        (INCOMING_REQUEST_STATUS_ORDER[right.status] ?? 99);

      if (statusOrder !== 0) {
        return statusOrder;
      }

      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    });

  return {
    myRequests: requests.filter(
      (request) =>
        request.requesterId === userId && request.itemOwnerId !== userId
    ),
    requestsForMyItems,
  };
}

function requestStatusClassName(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-warning-100 text-warning-800";
    case "APPROVED":
      return "bg-success-100 text-success-800";
    case "BORROWED":
      return "bg-primary-100 text-primary-800";
    case "RETURNED":
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-danger-100 text-danger-800";
  }
}

export default function LendingDashboardPage() {
  const data = useLoaderData<typeof loader>();
  const { myRequests, requestsForMyItems } = partitionLendingRequests(
    data.requests,
    data.userId
  );
  const activeMyRequests = myRequests.filter((request) =>
    ACTIVE_BORROWER_REQUEST_STATUSES.includes(
      request.status as (typeof ACTIVE_BORROWER_REQUEST_STATUSES)[number]
    )
  );
  const pastMyRequests = myRequests.filter((request) =>
    PAST_BORROWER_REQUEST_STATUSES.has(request.status)
  );

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Lending Dashboard</h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          Track all your lending activity and requests.
        </p>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        {/* My Requests */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">My Borrowing Requests</h3>
          {myRequests.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg text-center py-12">
              <p className="text-neutral-500 mb-2">No borrowing requests yet.</p>
              <Link
                to="/communities"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Browse communities to find items →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {activeMyRequests.length > 0 ? (
                <div className="space-y-4">
                  {activeMyRequests.map((request) => {
                    const queue =
                      request.status === "PENDING"
                        ? getQueuePositionForUser(
                            request.item.lendingRequests,
                            data.userId
                          )
                        : null;

                    return (
                      <div
                        key={request.id}
                        className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900">{request.item.name}</h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              From {request.itemOwner.name || request.itemOwner.email}
                            </p>
                            {queue ? (
                              <p className="mt-1 text-sm text-neutral-600">
                                Queue position #{queue.position} of {queue.total}
                              </p>
                            ) : null}
                            {request.dueDate ? (
                              <p className="mt-1 text-sm text-neutral-600">
                                Suggested return {formatDueDate(request.dueDate)}
                              </p>
                            ) : null}
                            {request.requestNote && (
                              <p className="mt-2 text-sm text-neutral-700">
                                "{request.requestNote}"
                              </p>
                            )}
                            {request.responseNote && (
                              <p className="mt-2 text-sm text-neutral-700">
                                <strong>Owner response:</strong> "
                                {request.responseNote}"
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${requestStatusClassName(
                                request.status
                              )}`}
                            >
                              {getBorrowerRequestStatusLabel(request.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs text-neutral-500">
                            {request.status === "BORROWED" && request.borrowedAt
                              ? `Borrowed on ${formatLendingRequestDateTime(
                                  request.borrowedAt
                                )}`
                              : `Requested on ${formatLendingRequestDateTime(
                                  request.createdAt
                                )}`}
                          </span>
                          {request.status === "PENDING" ? (
                            <Form method="post">
                              <input
                                type="hidden"
                                name="requestId"
                                value={request.id}
                              />
                              <input type="hidden" name="intent" value="cancel" />
                              <button
                                type="submit"
                                className="text-sm font-medium text-danger-700 hover:text-danger-800"
                                onClick={(event) => {
                                  if (
                                    !confirm(
                                      "Cancel this borrow request?"
                                    )
                                  ) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                Cancel request
                              </button>
                            </Form>
                          ) : null}
                          {request.status === "APPROVED" ? (
                            <Form method="post">
                              <input
                                type="hidden"
                                name="requestId"
                                value={request.id}
                              />
                              <input
                                type="hidden"
                                name="intent"
                                value="mark-picked-up"
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                              >
                                Mark as picked up
                              </button>
                            </Form>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {pastMyRequests.length > 0 ? (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-neutral-500">
                    Past requests
                  </h4>
                  <div className="space-y-4">
                    {pastMyRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900">{request.item.name}</h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              From {request.itemOwner.name || request.itemOwner.email}
                            </p>
                            {request.dueDate ? (
                              <p className="mt-1 text-sm text-neutral-600">
                                Suggested return {formatDueDate(request.dueDate)}
                              </p>
                            ) : null}
                            {request.requestNote && (
                              <p className="mt-2 text-sm text-neutral-700">
                                "{request.requestNote}"
                              </p>
                            )}
                            {request.responseNote && (
                              <p className="mt-2 text-sm text-neutral-700">
                                <strong>Owner response:</strong> "
                                {request.responseNote}"
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${requestStatusClassName(
                                request.status
                              )}`}
                            >
                              {getBorrowerRequestStatusLabel(request.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-neutral-500">
                          {request.status === "RETURNED" && request.returnedAt
                            ? `Returned on ${formatLendingRequestDateTime(
                                request.returnedAt
                              )}`
                            : `Requested on ${formatLendingRequestDateTime(
                                request.createdAt
                              )}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Requests for My Items */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">Requests for My Items</h3>
          {requestsForMyItems.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg text-center py-12">
              <p className="text-neutral-500 mb-2">No active requests for your items.</p>
              <Link
                to="/communities"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Add items to your communities →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requestsForMyItems.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900">{request.item.name}</h4>
                      <p className="text-sm text-neutral-600 mt-1">
                        Requested by{" "}
                        {request.requester.name || request.requester.email}
                      </p>
                      {request.dueDate ? (
                        <p className="mt-1 text-sm text-neutral-600">
                          Suggested return {formatDueDate(request.dueDate)}
                        </p>
                      ) : null}
                      {request.requestNote && (
                        <p className="mt-2 text-sm text-neutral-700">
                          "{request.requestNote}"
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${requestStatusClassName(
                          request.status
                        )}`}
                      >
                        {getBorrowerRequestStatusLabel(request.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs text-neutral-500">
                      {request.status === "BORROWED" && request.borrowedAt
                        ? `Borrowed on ${formatLendingRequestDateTime(
                            request.borrowedAt
                          )}`
                        : `Requested on ${formatLendingRequestDateTime(
                            request.createdAt
                          )}`}
                    </span>
                    <Link
                      to={`/items/${request.item.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium self-start sm:self-auto"
                    >
                      View Item →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
