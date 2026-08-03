export const ITEM_CATEGORIES = [
  "Book",
  "Tool",
  "DVD/Blu-ray",
  "Game",
  "Kitchen Item",
  "Electronics",
  "Sports Equipment",
  "Clothing",
  "Other",
] as const;

export const ITEM_CONDITIONS = [
  "Excellent",
  "Good",
  "Fair",
  "Poor",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export function isBookCategory(category: string | null | undefined) {
  return category === "Book";
}

export function isMovieCategory(category: string | null | undefined) {
  return category === "DVD/Blu-ray";
}

export function normalizeIsbn(raw: string) {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(isbn: string) {
  return isbn.length === 10 || isbn.length === 13;
}
