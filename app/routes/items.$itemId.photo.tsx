import type { LoaderFunctionArgs } from "@remix-run/node";

import {
  canUserViewItemPhoto,
  getItemPhotoResponse,
} from "~/utils/item-photo.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Not found", { status: 404 });
  }

  const item = await canUserViewItemPhoto({ userId, itemId });

  if (!item?.photoKey) {
    throw new Response("Not found", { status: 404 });
  }

  const photo = await getItemPhotoResponse(item.photoKey);

  if (!photo) {
    throw new Response("Photo unavailable", { status: 503 });
  }

  return new Response(new Uint8Array(photo.body), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
};
