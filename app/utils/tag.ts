export const MAX_TAGS_PER_ITEM = 10;
export const MAX_TAG_LENGTH = 30;

export function normalizeTagSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatTagDisplayName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseTagsFromForm(formData: FormData): string[] {
  const rawTags = formData.getAll("tags");
  const names: string[] = [];

  for (const raw of rawTags) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      names.push(trimmed);
    }
  }

  return dedupeTagNames(names);
}

export function dedupeTagNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const slug = normalizeTagSlug(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(name.trim());
  }

  return result;
}

export function validateTagNames(names: string[]): string | null {
  if (names.length > MAX_TAGS_PER_ITEM) {
    return `You can add at most ${MAX_TAGS_PER_ITEM} tags.`;
  }

  for (const name of names) {
    if (name.length > MAX_TAG_LENGTH) {
      return `Each tag must be ${MAX_TAG_LENGTH} characters or fewer.`;
    }
    if (!normalizeTagSlug(name)) {
      return "Tags must contain letters or numbers.";
    }
  }

  return null;
}

export function parseTagSlugsFromSearchParams(
  searchParams: URLSearchParams
): string[] {
  const slugs = searchParams
    .getAll("tag")
    .map((tag) => normalizeTagSlug(tag))
    .filter(Boolean);

  return [...new Set(slugs)];
}

export function buildTagFilterHref({
  tagSlug,
  search,
  selectedSlugs = [],
  toggle = true,
}: {
  tagSlug: string;
  search?: string;
  selectedSlugs?: string[];
  toggle?: boolean;
}) {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }

  const isSelected = selectedSlugs.includes(tagSlug);
  const nextSlugs = toggle
    ? isSelected
      ? selectedSlugs.filter((slug) => slug !== tagSlug)
      : [...selectedSlugs, tagSlug]
    : [tagSlug];

  for (const slug of nextSlugs) {
    params.append("tag", slug);
  }

  const query = params.toString();
  return query ? `?${query}` : ".";
}
