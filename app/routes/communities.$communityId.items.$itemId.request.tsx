import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { getItem, requestToBorrowItem } from "~/models/item.server";
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

  // Check if user already has a pending request (allow queue but not duplicate requests)
  const existingRequest = item.lendingRequests.find(
    (request) => request.requesterId === userId && request.status === "PENDING"
  );

  if (existingRequest) {
    throw new Response("You already have a pending request for this item", {
      status: 400,
    });
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
  const requestNote = formData.get("requestNote");

  await requestToBorrowItem({
    requesterId: userId,
    itemId,
    requestNote: typeof requestNote === "string" ? requestNote : undefined,
  });

  return redirect(`/communities/${params.communityId}/items/${itemId}`);
};

export default function RequestBorrowPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (actionData?.errors?.requestNote) {
      noteRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Request to Borrow</h2>
        <p className="mt-2 text-gray-600">
          You're requesting to borrow "{data.item.name}" from{" "}
          {data.item.owner.name || data.item.owner.email}
        </p>
        {!data.item.isAvailable && (
          <div className="mt-3 rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This item is currently borrowed, but you
              can still request it. You'll be added to the queue and notified
              when it becomes available.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold">Item Details</h3>
        <div className="mt-2 text-sm text-gray-600">
          <p>
            <strong>Name:</strong> {data.item.name}
          </p>
          {data.item.description && (
            <p>
              <strong>Description:</strong> {data.item.description}
            </p>
          )}
          {data.item.category && (
            <p>
              <strong>Category:</strong> {data.item.category}
            </p>
          )}
          {data.item.condition && (
            <p>
              <strong>Condition:</strong> {data.item.condition}
            </p>
          )}
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <div>
          <label
            htmlFor="requestNote"
            className="block text-sm font-medium text-gray-700"
          >
            Message to Owner (Optional)
          </label>
          <div className="mt-1">
            <textarea
              ref={noteRef}
              id="requestNote"
              name="requestNote"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
              placeholder="Let the owner know when you need it, how long you'll keep it, or any other relevant information..."
              aria-invalid={actionData?.errors?.requestNote ? true : undefined}
              aria-describedby={
                actionData?.errors?.requestNote
                  ? "requestNote-error"
                  : undefined
              }
            />
            {actionData?.errors?.requestNote ? (
              <div className="pt-1 text-red-700" id="requestNote-error">
                {actionData.errors.requestNote}
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This message will be sent to the item owner along with your request.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to={`/communities/${data.item.community.id}/items/${data.item.id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Send Request
          </button>
        </div>
      </Form>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-medium text-blue-800">
          What happens next?
        </h4>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• The item owner will receive your request</li>
          <li>• They can approve or decline your request</li>
          <li>• You'll be notified of their decision</li>
          <li>• If approved, you can arrange pickup with the owner</li>
        </ul>
      </div>
    </div>
  );
}
