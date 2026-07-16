import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import {
  getCommunity,
  isUserMemberOfCommunity,
} from "~/models/community.server";
import { createItem } from "~/models/item.server";
import { syncItemTags } from "~/models/tag.server";
import TagInput from "~/components/TagInput";
import { requireUserId } from "~/session.server";
import { parseTagsFromForm, validateTagNames } from "~/utils/tag";

type ItemFormErrors = {
  name?: string;
  tags?: string;
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const community = await getCommunity({ id: communityId });
  if (!community) {
    throw new Response("Community not found", { status: 404 });
  }

  const isMember = await isUserMemberOfCommunity({ userId, communityId });
  if (!isMember) {
    throw new Response("Unauthorized - You must be a member to add items", {
      status: 403,
    });
  }

  return json({ community });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const communityId = params.communityId;

  if (!communityId) {
    throw new Response("Community not found", { status: 404 });
  }

  const isMember = await isUserMemberOfCommunity({ userId, communityId });
  if (!isMember) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const condition = formData.get("condition");
  const tagNames = parseTagsFromForm(formData);
  const tagError = validateTagNames(tagNames);

  if (typeof name !== "string" || name.length === 0) {
    return json<{ errors: ItemFormErrors }>(
      { errors: { name: "Item name is required" } },
      { status: 400 }
    );
  }

  if (tagError) {
    return json<{ errors: ItemFormErrors }>(
      { errors: { tags: tagError } },
      { status: 400 }
    );
  }

  const item = await createItem({
    name,
    description: typeof description === "string" ? description : undefined,
    category: typeof category === "string" ? category : undefined,
    condition: typeof condition === "string" ? condition : undefined,
    ownerId: userId,
  });

  await syncItemTags(item.id, tagNames);

  return redirect(`/communities/${communityId}/items`);
};

export default function NewCommunityItemPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    }
  }, [actionData]);

  const categories = [
    "Book",
    "Tool",
    "DVD/Blu-ray",
    "Game",
    "Kitchen Item",
    "Electronics",
    "Sports Equipment",
    "Clothing",
    "Other",
  ];

  const conditions = ["Excellent", "Good", "Fair", "Poor"];

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Link
          to={`/communities/${data.community.id}/items`}
          className="text-primary-600 hover:text-primary-800 text-sm"
        >
          ← Back to {data.community.name} Items
        </Link>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold">Add New Item to {data.community.name}</h2>
      <p className="mt-2 text-gray-600">
        Add an item that you're willing to share with this community.
      </p>

      <Form method="post" className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Item Name *
          </label>
          <div className="mt-1">
            <input
              ref={nameRef}
              id="name"
              required
              autoFocus={true}
              name="name"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-describedby={
                actionData?.errors?.name ? "name-error" : undefined
              }
            />
            {actionData?.errors?.name ? (
              <div className="pt-1 text-danger-700" id="name-error">
                {actionData.errors.name}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              placeholder="Describe the item, any special instructions, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <div className="mt-1">
              <select
                id="category"
                name="category"
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="block text-sm font-medium text-gray-700"
            >
              Condition
            </label>
            <div className="mt-1">
              <select
                id="condition"
                name="condition"
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              >
                <option value="">Select condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TagInput error={actionData?.errors?.tags} />

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link
            to={`/communities/${data.community.id}/items`}
            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center sm:inline-flex"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto rounded-md bg-success-500 px-6 py-3 text-base font-medium text-white hover:bg-success-700 min-h-[44px]"
          >
            Add Item
          </button>
        </div>
      </Form>
    </div>
  );
}
