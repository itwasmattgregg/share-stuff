import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getPopularTags } from "~/models/tag.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const tags = await getPopularTags({ userId, limit: 50 });

  return json({ tags });
};

export default function TagsIndexPage() {
  const { tags } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Explore Tags</h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          Browse tags used across items in your communities to discover things to borrow.
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">No tags yet.</p>
          <p className="mt-2 text-sm text-neutral-400">
            Add tags to your items to help others find them.
          </p>
          <Link
            to="/items/new"
            className="mt-4 inline-block rounded-lg bg-primary-500 px-6 py-3 text-white font-medium hover:bg-primary-600"
          >
            Add an item with tags
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.slug}`}
              className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-neutral-900">{tag.name}</h2>
              <p className="mt-2 text-sm text-neutral-600">
                {tag.count} item{tag.count !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
