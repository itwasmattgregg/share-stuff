import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createItem } from "~/models/item.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const condition = formData.get("condition");

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Item name is required" } }, { status: 400 });
  }

  const item = await createItem({
    name,
    description: typeof description === "string" ? description : undefined,
    category: typeof category === "string" ? category : undefined,
    condition: typeof condition === "string" ? condition : undefined,
    ownerId: userId,
  });

  return redirect(`/items/${item.id}`);
};

export default function NewItemPage() {
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
      <h2 className="text-2xl font-bold">Add New Item</h2>
      <p className="mt-2 text-gray-600">
        Add an item to your collection that you can share with your communities.
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

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Add Item
          </button>
        </div>
      </Form>
    </div>
  );
}
