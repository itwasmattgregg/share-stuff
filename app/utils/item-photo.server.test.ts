import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  item: {
    findUnique: vi.fn(),
  },
  community: {
    count: vi.fn(),
  },
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

vi.mock("~/models/storage.server", () => ({
  isStorageConfigured: vi.fn(() => true),
  buildItemPhotoKey: vi.fn(() => "items/item-1/test.webp"),
  uploadObject: vi.fn(),
  deleteObject: vi.fn(),
  getObject: vi.fn(),
}));

import {
  ALLOWED_ITEM_PHOTO_TYPES,
  MAX_ITEM_PHOTO_BYTES,
  canUserViewItemPhoto,
  parseItemPhotoUpload,
} from "./item-photo.server";

function createMockFile({
  type,
  size,
  contents = "photo-data",
}: {
  type: string;
  size: number;
  contents?: string;
}) {
  const buffer = Buffer.alloc(size, contents);

  return {
    type,
    size,
    arrayBuffer: async () =>
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  } as File;
}

describe("parseItemPhotoUpload", () => {
  it("accepts missing photo uploads", async () => {
    await expect(parseItemPhotoUpload(null)).resolves.toEqual({
      ok: true,
      data: null,
    });
  });

  it("rejects unsupported photo types", async () => {
    const result = await parseItemPhotoUpload(
      createMockFile({ type: "image/png", size: 1024 })
    );

    expect(result).toEqual({
      ok: false,
      error: "Photo must be a JPEG or WebP image.",
    });
  });

  it("rejects photos larger than the upload limit", async () => {
    const result = await parseItemPhotoUpload(
      createMockFile({
        type: "image/webp",
        size: MAX_ITEM_PHOTO_BYTES + 1,
      })
    );

    expect(result).toEqual({
      ok: false,
      error: "Photo must be 512KB or smaller after compression.",
    });
  });

  it("accepts compressed webp uploads", async () => {
    const result = await parseItemPhotoUpload(
      createMockFile({ type: "image/webp", size: 2048 })
    );

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data.contentType).toBe("image/webp");
      expect(result.data.extension).toBe("webp");
      expect(ALLOWED_ITEM_PHOTO_TYPES.has(result.data.contentType)).toBe(true);
    }
  });
});

describe("canUserViewItemPhoto", () => {
  beforeEach(() => {
    prismaMock.item.findUnique.mockReset();
    prismaMock.community.count.mockReset();
  });

  it("allows owners to view their item photo", async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      photoKey: "items/item-1/test.webp",
    });

    const item = await canUserViewItemPhoto({
      userId: "owner-1",
      itemId: "item-1",
    });

    expect(item?.photoKey).toBe("items/item-1/test.webp");
    expect(prismaMock.community.count).not.toHaveBeenCalled();
  });

  it("allows community members who share a community with the owner", async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      photoKey: "items/item-1/test.webp",
    });
    prismaMock.community.count.mockResolvedValue(1);

    const item = await canUserViewItemPhoto({
      userId: "member-1",
      itemId: "item-1",
    });

    expect(item?.photoKey).toBe("items/item-1/test.webp");
  });

  it("denies users without a shared community", async () => {
    prismaMock.item.findUnique.mockResolvedValue({
      ownerId: "owner-1",
      photoKey: "items/item-1/test.webp",
    });
    prismaMock.community.count.mockResolvedValue(0);

    const item = await canUserViewItemPhoto({
      userId: "stranger-1",
      itemId: "item-1",
    });

    expect(item).toBeNull();
  });
});
