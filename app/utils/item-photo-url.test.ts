import { describe, expect, it } from "vitest";

import {
  hasItemPhoto,
  normalizeExternalPhotoUrl,
} from "~/utils/item-photo-url";

describe("normalizeExternalPhotoUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(
      normalizeExternalPhotoUrl("https://covers.openlibrary.org/b/id/1-M.jpg")
    ).toBe("https://covers.openlibrary.org/b/id/1-M.jpg");
  });

  it("rejects empty and non-http values", () => {
    expect(normalizeExternalPhotoUrl("")).toBeNull();
    expect(normalizeExternalPhotoUrl("   ")).toBeNull();
    expect(normalizeExternalPhotoUrl("ftp://example.com/a.jpg")).toBeNull();
    expect(normalizeExternalPhotoUrl("not-a-url")).toBeNull();
  });
});

describe("hasItemPhoto", () => {
  it("prefers either uploaded key or external URL", () => {
    expect(hasItemPhoto({ photoKey: "a", photoUrl: null })).toBe(true);
    expect(hasItemPhoto({ photoKey: null, photoUrl: "https://x.test/a.jpg" })).toBe(
      true
    );
    expect(hasItemPhoto({ photoKey: null, photoUrl: null })).toBe(false);
  });
});
