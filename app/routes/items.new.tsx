import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useSearchParams } from "@remix-run/react";

import ItemQuickAddForm from "~/components/ItemQuickAddForm";
import { createItem, updateItem } from "~/models/item.server";
import { isMovieLookupConfigured } from "~/models/lookup.server";
import {
  buildItemPhotoKey,
  isStorageConfigured,
  uploadObject,
} from "~/models/storage.server";
import { syncItemTags } from "~/models/tag.server";
import { requireUserId } from "~/session.server";
import { parseItemPhotoUpload } from "~/utils/item-photo.server";
import { parseTagsFromForm, validateTagNames } from "~/utils/tag";

type ItemFormErrors = {
  name?: string;
  photo?: string;
  tags?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  return json({
    photoUploadEnabled: isStorageConfigured(),
    movieLookupEnabled: isMovieLookupConfigured(),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const condition = formData.get("condition");
  const photo = formData.get("photo");
  const intent = formData.get("intent");
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

  const parsedPhoto = await parseItemPhotoUpload(photo);

  if (!parsedPhoto.ok) {
    return json<{ errors: ItemFormErrors }>(
      { errors: { photo: parsedPhoto.error } },
      { status: 400 }
    );
  }

  if (parsedPhoto.data && !isStorageConfigured()) {
    return json<{ errors: ItemFormErrors }>(
      {
        errors: {
          photo:
            "Photo uploads are not configured. Ask the site admin to set up object storage.",
        },
      },
      { status: 400 }
    );
  }

  const normalizedCategory =
    typeof category === "string" && category.length > 0 ? category : undefined;
  const normalizedCondition =
    typeof condition === "string" && condition.length > 0
      ? condition
      : undefined;
  const normalizedDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : undefined;

  const item = await createItem({
    name: name.trim(),
    description: normalizedDescription,
    category: normalizedCategory,
    condition: normalizedCondition,
    ownerId: userId,
  });

  await syncItemTags(item.id, tagNames);

  if (parsedPhoto.data) {
    const photoKey = buildItemPhotoKey(item.id, parsedPhoto.data.extension);

    await uploadObject({
      key: photoKey,
      body: parsedPhoto.data.buffer,
      contentType: parsedPhoto.data.contentType,
    });

    await updateItem({
      id: item.id,
      photoKey,
    });
  }

  if (intent === "add-another") {
    const params = new URLSearchParams({
      added: name.trim(),
    });
    if (normalizedCategory) {
      params.set("category", normalizedCategory);
    }
    return redirect(`/items/new?${params.toString()}`);
  }

  return redirect(`/items/${item.id}`);
};

export default function NewItemPage() {
  const { photoUploadEnabled, movieLookupEnabled } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const recentlyAddedName = searchParams.get("added");
  const initialCategory = searchParams.get("category");

  return (
    <ItemQuickAddForm
      photoUploadEnabled={photoUploadEnabled}
      movieLookupEnabled={movieLookupEnabled}
      recentlyAddedName={recentlyAddedName}
      initialCategory={initialCategory}
      errors={actionData?.errors}
    />
  );
}
