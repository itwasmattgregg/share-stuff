import { prisma } from "~/db.server";
import {
  buildItemPhotoKey,
  deleteObject,
  getObject,
  isStorageConfigured,
  uploadObject,
} from "~/models/storage.server";

export const MAX_ITEM_PHOTO_BYTES = 512 * 1024;
export const ALLOWED_ITEM_PHOTO_TYPES = new Set(["image/jpeg", "image/webp"]);

type ParsedPhotoUpload =
  | { ok: true; data: null }
  | {
      ok: true;
      data: {
        buffer: Buffer;
        contentType: "image/jpeg" | "image/webp";
        extension: "jpeg" | "webp";
      };
    }
  | { ok: false; error: string };

export async function parseItemPhotoUpload(
  photo: FormDataEntryValue | null
): Promise<ParsedPhotoUpload> {
  if (!photo || typeof photo === "string") {
    return { ok: true, data: null };
  }

  if (photo.size === 0) {
    return { ok: true, data: null };
  }

  if (!ALLOWED_ITEM_PHOTO_TYPES.has(photo.type)) {
    return {
      ok: false,
      error: "Photo must be a JPEG or WebP image.",
    };
  }

  if (photo.size > MAX_ITEM_PHOTO_BYTES) {
    return {
      ok: false,
      error: "Photo must be 512KB or smaller after compression.",
    };
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const extension = photo.type === "image/webp" ? "webp" : "jpeg";

  return {
    ok: true,
    data: {
      buffer,
      contentType: photo.type as "image/jpeg" | "image/webp",
      extension,
    },
  };
}

export async function canUserViewItemPhoto({
  userId,
  itemId,
}: {
  userId: string;
  itemId: string;
}) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { ownerId: true, photoKey: true },
  });

  if (!item?.photoKey) {
    return null;
  }

  if (item.ownerId === userId) {
    return item;
  }

  const sharedCommunityCount = await prisma.community.count({
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
            {
              memberships: {
                some: {
                  userId,
                  status: "APPROVED",
                },
              },
            },
          ],
        },
        {
          OR: [
            { ownerId: item.ownerId },
            {
              memberships: {
                some: {
                  userId: item.ownerId,
                  status: "APPROVED",
                },
              },
            },
          ],
        },
      ],
    },
  });

  return sharedCommunityCount > 0 ? item : null;
}

export async function saveItemPhoto({
  itemId,
  photo,
}: {
  itemId: string;
  photo: FormDataEntryValue | null;
}) {
  if (!isStorageConfigured()) {
    return {
      ok: false as const,
      error:
        "Photo uploads are not configured. Ask the site admin to set up object storage.",
    };
  }

  const parsed = await parseItemPhotoUpload(photo);

  if (!parsed.ok) {
    return parsed;
  }

  if (!parsed.data) {
    return { ok: true as const, photoKey: null };
  }

  const photoKey = buildItemPhotoKey(itemId, parsed.data.extension);

  await uploadObject({
    key: photoKey,
    body: parsed.data.buffer,
    contentType: parsed.data.contentType,
  });

  return { ok: true as const, photoKey };
}

export async function applyItemPhotoChanges({
  itemId,
  existingPhotoKey,
  photo,
  removePhoto,
}: {
  itemId: string;
  existingPhotoKey: string | null;
  photo: FormDataEntryValue | null;
  removePhoto: boolean;
}) {
  if (removePhoto) {
    if (existingPhotoKey) {
      await removeItemPhoto(existingPhotoKey);
    }
    return { ok: true as const, photoKey: null as string | null };
  }

  const result = await saveItemPhoto({ itemId, photo });

  if (!result.ok) {
    return result;
  }

  if (result.photoKey) {
    if (existingPhotoKey && existingPhotoKey !== result.photoKey) {
      await removeItemPhoto(existingPhotoKey);
    }
    return { ok: true as const, photoKey: result.photoKey };
  }

  return { ok: true as const, photoKey: undefined as string | null | undefined };
}

export async function removeItemPhoto(photoKey: string | null | undefined) {
  if (!photoKey || !isStorageConfigured()) {
    return;
  }

  await deleteObject({ key: photoKey });
}

export async function getItemPhotoResponse(photoKey: string) {
  if (!isStorageConfigured()) {
    return null;
  }

  return getObject({ key: photoKey });
}
