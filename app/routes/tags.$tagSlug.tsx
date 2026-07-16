import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import ItemPhoto from "~/components/ItemPhoto";
import TagPills from "~/components/TagPills";
import { getItemsByTagSlug } from "~/models/tag.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const tagSlug = params.tagSlug;

  if (!tagSlug) {
    throw new Response("Tag not found", { status: 404 });
  }

  const url = new URL(request.url);
  const communityId = url.searchParams.get("communityId") || undefined;

  const { tag, items } = await getItemsByTagSlug({
    slug: tagSlug,
    userId,
    communityId,
  });

  if (!tag) {
    throw new Response("Tag not found", { status: 404 });
  }

  return json({ tag, items, communityId });
};

export default function TagDetailPage() {
  const { tag, items } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/tags"
          className="text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          ← Back to all tags
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-neutral-900">
          #{tag.name}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          {items.length} item{items.length !== 1 ? "s" : ""} tagged with this label
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">No items found with this tag.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <ItemPhoto
                itemId={item.id}
                photoKey={item.photoKey}
                alt={item.name}
                className="mb-4 h-40 w-full rounded-lg border border-neutral-200 object-cover"
              />
              <h2 className="text-lg font-semibold text-neutral-900">{item.name}</h2>
              <p className="mt-1 text-sm text-neutral-600">
                by {item.owner.name || item.owner.email}
              </p>
              {item.description ? (
                <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                  {item.description}
                </p>
              ) : null}
              <TagPills
                tags={item.itemTags.map((itemTag) => itemTag.tag)}
                linkable
                className="mt-3"
              />
              <Link
                to={`/items/${item.id}`}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                View Item
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
