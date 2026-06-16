import imageCompression from "browser-image-compression";

const MAX_DIMENSION = 1600;
const MAX_SIZE_MB = 0.4;
const MAX_SIZE_BYTES = 512 * 1024;

export async function compressItemPhoto(file: File) {
  const prefersWebP =
    typeof document !== "undefined" &&
    document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");

  let compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: prefersWebP ? "image/webp" : "image/jpeg",
    initialQuality: 0.82,
  });

  if (compressed.size > MAX_SIZE_BYTES) {
    compressed = await imageCompression(compressed, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: prefersWebP ? "image/webp" : "image/jpeg",
      initialQuality: 0.7,
    });
  }

  if (compressed.size > MAX_SIZE_BYTES) {
    throw new Error("Photo is still too large after compression. Try a smaller image.");
  }

  const extension = compressed.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "item-photo";

  return new File([compressed], `${baseName}.${extension}`, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}
