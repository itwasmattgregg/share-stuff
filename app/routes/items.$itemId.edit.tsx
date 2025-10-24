import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { getItem, updateItem } from "~/models/item.server";
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

  // Check if user owns this item
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

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  // Check if user owns this item
  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const condition = formData.get("condition");
  const isAvailable = formData.get("isAvailable") === "true";

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Item name is required" } }, { status: 400 });
  }

  await updateItem({
    id: itemId,
    name,
    description: typeof description === "string" ? description : undefined,
    category: typeof category === "string" ? category : undefined,
    condition: typeof condition === "string" ? condition : undefined,
    isAvailable,
  });

  return redirect(`/items/${itemId}`);
};

export default function EditItemPage() {
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
      <h2 className="text-2xl font-bold">Edit Item</h2>
      <p className="mt-2 text-gray-600">
        Update your item details.
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
              defaultValue={data.item.name}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-describedby={
                actionData?.errors?.name ? "name-error" : undefined
              }
            />
            {actionData?.errors?.name ? (
              <div className="pt-1 text-red-700" id="name-error">
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
              defaultValue={data.item.description || ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
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
                defaultValue={data.item.category || ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
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
                defaultValue={data.item.condition || ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
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

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isAvailable"
              value="true"
              defaultChecked={data.item.isAvailable}
              className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              Item is available for lending
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to={`/items/${data.item.id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Update Item
          </button>
        </div>
      </Form>
    </div>
  );
}
