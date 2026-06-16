import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import ItemPhotoField from "~/components/ItemPhotoField";
import { getItem, updateItem } from "~/models/item.server";
import { isStorageConfigured } from "~/models/storage.server";
import { requireUserId } from "~/session.server";
import { applyItemPhotoChanges } from "~/utils/item-photo.server";

type ItemFormErrors = {
  name?: string;
  photo?: string;
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({
    item,
    photoUploadEnabled: isStorageConfigured(),
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item not found", { status: 404 });
  }

  const item = await getItem({ id: itemId });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  if (item.ownerId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const condition = formData.get("condition");
  const isAvailable = formData.get("isAvailable") === "true";
  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "true";

  if (typeof name !== "string" || name.length === 0) {
    return json<{ errors: ItemFormErrors }>(
      { errors: { name: "Item name is required" } },
      { status: 400 }
    );
  }

  const photoResult = await applyItemPhotoChanges({
    itemId,
    existingPhotoKey: item.photoKey,
    photo,
    removePhoto,
  });

  if (!photoResult.ok) {
    return json<{ errors: ItemFormErrors }>(
      { errors: { photo: photoResult.error } },
      { status: 400 }
    );
  }

  await updateItem({
    id: itemId,
    name,
    description: typeof description === "string" ? description : undefined,
    category: typeof category === "string" ? category : undefined,
    condition: typeof condition === "string" ? condition : undefined,
    isAvailable,
    ...(photoResult.photoKey !== undefined
      ? { photoKey: photoResult.photoKey }
      : {}),
  });

  return redirect(`/items/${itemId}`);
};

export default function EditItemPage() {
  const { item, photoUploadEnabled } = useLoaderData<typeof loader>();
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
      <h2 className="text-xl sm:text-2xl font-bold">Edit Item</h2>
      <p className="mt-2 text-sm sm:text-base text-gray-600">
        Update your item details.
      </p>

      <Form method="post" encType="multipart/form-data" className="mt-6 space-y-6">
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
              defaultValue={item.name}
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
              defaultValue={item.description || ""}
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
                defaultValue={item.category || ""}
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
                defaultValue={item.condition || ""}
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

        {photoUploadEnabled ? (
          <ItemPhotoField
            itemId={item.id}
            photoKey={item.photoKey}
            error={actionData?.errors?.photo}
          />
        ) : item.photoKey ? (
          <p className="text-sm text-gray-500">
            This item has a photo, but uploads are not configured in this
            environment.
          </p>
        ) : null}

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isAvailable"
              value="true"
              defaultChecked={item.isAvailable}
              className="rounded border-gray-300 text-success-600 shadow-sm focus:border-success-300 focus:ring focus:ring-success-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              Item is available for lending
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link
            to={`/items/${item.id}`}
            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center sm:inline-flex"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto rounded-md bg-success-500 px-6 py-3 text-base font-medium text-white hover:bg-success-700 min-h-[44px]"
          >
            Update Item
          </button>
        </div>
      </Form>
    </div>
  );
}
