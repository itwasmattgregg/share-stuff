import { describe, expect, it } from "vitest";

import { safeRedirect, validateEmail, formatLendingRequestDateTime } from "./utils";

test("validateEmail returns false for non-emails", () => {
  expect(validateEmail(undefined)).toBe(false);
  expect(validateEmail(null)).toBe(false);
  expect(validateEmail("")).toBe(false);
  expect(validateEmail("not-an-email")).toBe(false);
  expect(validateEmail("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
  expect(validateEmail("kody@example.com")).toBe(true);
});

describe("safeRedirect", () => {
  it("returns the default for unsafe redirects", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect(null)).toBe("/");
  });

  it("allows same-origin relative paths", () => {
    expect(safeRedirect("/communities")).toBe("/communities");
    expect(safeRedirect("/items/new", "/communities")).toBe("/items/new");
  });
});

describe("formatLendingRequestDateTime", () => {
  it("includes both date and time", () => {
    const formatted = formatLendingRequestDateTime(
      new Date("2024-01-15T14:30:00")
    );

    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
    expect(formatted).toMatch(/2:30|14:30/);
  });
});
