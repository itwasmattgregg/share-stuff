import { describe, expect, it } from "vitest";

import { UNEXPECTED_ERROR_COPY, routeErrorCopy } from "./error-copy";

describe("routeErrorCopy", () => {
  it("explains a missing page without exposing framework internals", () => {
    const copy = routeErrorCopy(404);

    expect(copy.title).toMatch(/couldn't find that page/i);
    expect(copy.detail).toBe("Error 404");
  });

  it("explains a permission problem in terms of communities", () => {
    const copy = routeErrorCopy(403);

    expect(copy.title).toMatch(/don't have access/i);
    expect(copy.message).toMatch(/community/i);
  });

  it("explains that a rejected action may already have happened", () => {
    const copy = routeErrorCopy(400);

    expect(copy.message).toMatch(/already been done/i);
  });

  it("falls back to the generic copy for unmapped statuses", () => {
    const copy = routeErrorCopy(500);

    expect(copy.title).toBe(UNEXPECTED_ERROR_COPY.title);
    expect(copy.detail).toBe("Error 500");
  });
});
