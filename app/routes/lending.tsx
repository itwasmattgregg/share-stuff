import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getLendingRequestsForUser } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const requests = await getLendingRequestsForUser({ userId });
  return json({ requests });
};

export default function LendingDashboardPage() {
  const data = useLoaderData<typeof loader>();

  const myRequests = data.requests.filter(
    (request) => request.requesterId === data.requests[0]?.requesterId
  );
  const requestsForMyItems = data.requests.filter(
    (request) => request.itemOwnerId === data.requests[0]?.requesterId
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Lending Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Track all your lending activity and requests.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Requests */}
        <div>
          <h3 className="text-lg font-semibold mb-4">My Borrowing Requests</h3>
          {myRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No borrowing requests yet.</p>
              <Link
                to="/communities"
                className="mt-2 inline-block text-blue-500 hover:text-blue-600"
              >
                Browse communities to find items
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{request.item.name}</h4>
                      <p className="text-sm text-gray-600">
                        From {request.itemOwner.name || request.itemOwner.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.item.community.name}
                      </p>
                      {request.requestNote && (
                        <p className="mt-2 text-sm text-gray-700">
                          "{request.requestNote}"
                        </p>
                      )}
                      {request.responseNote && (
                        <p className="mt-2 text-sm text-gray-700">
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
                  <div className="mt-3 text-xs text-gray-500">
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
          <h3 className="text-lg font-semibold mb-4">Requests for My Items</h3>
          {requestsForMyItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No requests for your items yet.</p>
              <Link
                to="/communities"
                className="mt-2 inline-block text-blue-500 hover:text-blue-600"
              >
                Add items to your communities
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requestsForMyItems.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{request.item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Requested by{" "}
                        {request.requester.name || request.requester.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.item.community.name}
                      </p>
                      {request.requestNote && (
                        <p className="mt-2 text-sm text-gray-700">
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
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/communities/${request.item.community.id}/items/${request.item.id}/requests`}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Manage Request
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
