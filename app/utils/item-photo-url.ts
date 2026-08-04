/**
 * Normalize and validate an external item photo URL from lookup providers.
 * Returns null when the value is empty or not a safe http(s) URL.
 */
export function normalizeExternalPhotoUrl(
  value: FormDataEntryValue | string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  return url.toString();
}

export function hasItemPhoto({
  photoKey,
  photoUrl,
}: {
  photoKey?: string | null;
  photoUrl?: string | null;
}) {
  return Boolean(photoKey || photoUrl);
}
