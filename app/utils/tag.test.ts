import { describe, expect, it } from "vitest";

import {
  MAX_TAGS_PER_ITEM,
  dedupeTagNames,
  formatTagDisplayName,
  normalizeTagSlug,
  parseTagSlugsFromSearchParams,
  parseTagsFromForm,
  validateTagNames,
} from "./tag";

describe("normalizeTagSlug", () => {
  it("lowercases and hyphenates tags", () => {
    expect(normalizeTagSlug("Camping Gear")).toBe("camping-gear");
    expect(normalizeTagSlug("  Family Friendly  ")).toBe("family-friendly");
  });

  it("strips invalid characters", () => {
    expect(normalizeTagSlug("tool#1!")).toBe("tool1");
  });
});

describe("formatTagDisplayName", () => {
  it("title-cases slug segments", () => {
    expect(formatTagDisplayName("camping-gear")).toBe("Camping Gear");
  });
});

describe("parseTagsFromForm", () => {
  it("reads repeated tags fields", () => {
    const formData = new FormData();
    formData.append("tags", "camping");
    formData.append("tags", "outdoor");
    formData.append("tags", "camping");

    expect(parseTagsFromForm(formData)).toEqual(["camping", "outdoor"]);
  });
});

describe("dedupeTagNames", () => {
  it("removes case-insensitive duplicates", () => {
    expect(dedupeTagNames(["Camping", "camping", "Outdoor"])).toEqual([
      "Camping",
      "Outdoor",
    ]);
  });
});

describe("validateTagNames", () => {
  it("rejects too many tags", () => {
    const names = Array.from({ length: MAX_TAGS_PER_ITEM + 1 }, (_, index) =>
      `tag-${index}`
    );

    expect(validateTagNames(names)).toMatch(/at most/);
  });

  it("accepts valid tags", () => {
    expect(validateTagNames(["camping", "outdoor"])).toBeNull();
  });
});

describe("parseTagSlugsFromSearchParams", () => {
  it("parses repeated tag params", () => {
    const params = new URLSearchParams();
    params.append("tag", "camping");
    params.append("tag", "outdoor");
    params.append("tag", "camping");

    expect(parseTagSlugsFromSearchParams(params)).toEqual(["camping", "outdoor"]);
  });
});
