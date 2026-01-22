import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Layout from "~/components/Layout";
import { getLendingRequestsForUser } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const requests = await getLendingRequestsForUser({ userId });
  return json({ requests });
};

export default function LendingDashboardPage() {
  const data = useLoaderData<typeof loader>();
  
  // Get user ID from first request (all requests are for this user)
  const userId = data.requests[0]?.requesterId || data.requests[0]?.itemOwnerId;
  
  const myRequests = data.requests.filter(
    (request) => request.requesterId === userId
  );
  const requestsForMyItems = data.requests.filter(
    (request) => request.itemOwnerId === userId && request.requesterId !== userId
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
            <div className="space-y-4">
              {myRequests.map((request) => (
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
                  </div>
                  <div className="mt-3 text-xs text-neutral-500">
                    Requested on{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests for My Items */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">Requests for My Items</h3>
          {requestsForMyItems.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg text-center py-12">
              <p className="text-neutral-500 mb-2">No requests for your items yet.</p>
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
                      {request.requestNote && (
                        <p className="mt-2 text-sm text-neutral-700">
                          "{request.requestNote}"
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
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
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs text-neutral-500">
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
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
