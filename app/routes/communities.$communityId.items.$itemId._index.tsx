import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import CommunityItemRequestLink from "~/components/CommunityItemRequestLink";
import ItemPhoto from "~/components/ItemPhoto";
import TagPills from "~/components/TagPills";
import { isUserMemberOfCommunity } from "~/models/community.server";
import { getItem, isItemVisibleInCommunity } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;
  const itemId = params.itemId;

  if (!communityId || !itemId) {
    throw new Response("Not found", { status: 404 });
  }

  const isMember = await isUserMemberOfCommunity({ userId, communityId });
  if (!isMember) {
    throw new Response("Forbidden", { status: 403 });
  }

  const item = await getItem({ id: itemId });
  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  const visible = await isItemVisibleInCommunity({ itemId, communityId });
  if (!visible) {
    throw new Response("Item not found", { status: 404 });
  }

  return json({
    item,
    communityId,
    userId,
    isOwner: item.ownerId === userId,
  });
};

export default function CommunityItemDetailPage() {
  const data = useLoaderData<typeof loader>();
  const { item, communityId, userId, isOwner } = data;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          to={`/communities/${communityId}/items`}
          className="text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          ← Back to community items
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{item.name}</h2>
          <p className="mt-1 text-neutral-600">
            Shared by {item.owner.name || item.owner.email}
          </p>
        </div>
        {isOwner ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/items/${item.id}`}
              className="rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
            >
              Manage Item
            </Link>
            <Link
              to={`/communities/${communityId}/items/${item.id}/requests`}
              className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-center text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              View Requests
            </Link>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <ItemPhoto
          itemId={item.id}
          photoKey={item.photoKey}
          alt={item.name}
          className="h-64 w-full rounded-lg border border-neutral-200 object-cover"
        />

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-neutral-900">Item Details</h3>

          {item.description ? (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-700">
                Description
              </h4>
              <p className="mt-1 text-neutral-900">{item.description}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {item.category ? (
              <div>
                <h4 className="text-sm font-medium text-neutral-700">
                  Category
                </h4>
                <p className="mt-1 text-neutral-900">{item.category}</p>
              </div>
            ) : null}
            {item.condition ? (
              <div>
                <h4 className="text-sm font-medium text-neutral-700">
                  Condition
                </h4>
                <p className="mt-1 text-neutral-900">{item.condition}</p>
              </div>
            ) : null}
          </div>

          <TagPills
            tags={item.itemTags.map((itemTag) => itemTag.tag)}
            linkable
            size="md"
            className="mt-4"
          />

          <div className="mt-4">
            <h4 className="text-sm font-medium text-neutral-700">Status</h4>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                item.isAvailable
                  ? "bg-success-100 text-success-800"
                  : "bg-danger-100 text-danger-800"
              }`}
            >
              {item.isAvailable ? "Available" : "Borrowed"}
            </span>
          </div>
        </div>

        {!isOwner ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <CommunityItemRequestLink
              itemId={item.id}
              communityId={communityId}
              ownerId={item.ownerId}
              userId={userId}
              isAvailable={item.isAvailable}
              lendingRequests={item.lendingRequests}
              className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-3 text-base font-medium shadow-md transition-colors min-h-[44px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
