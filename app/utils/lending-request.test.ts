import { describe, expect, it } from "vitest";

import {
  getActiveBorrowerRequestForUser,
  getBorrowerRequestStatusLabel,
} from "./lending-request";

describe("getActiveBorrowerRequestForUser", () => {
  const requests = [
    { requesterId: "borrower-1", status: "RETURNED" },
    { requesterId: "borrower-1", status: "PENDING" },
    { requesterId: "borrower-2", status: "BORROWED" },
  ];

  it("returns the active request for the matching user", () => {
    expect(getActiveBorrowerRequestForUser(requests, "borrower-1")).toEqual({
      requesterId: "borrower-1",
      status: "PENDING",
    });
  });

  it("ignores returned and rejected requests", () => {
    const inactive = [
      { requesterId: "borrower-1", status: "RETURNED" },
      { requesterId: "borrower-1", status: "REJECTED" },
    ];

    expect(getActiveBorrowerRequestForUser(inactive, "borrower-1")).toBeUndefined();
  });

  it("returns undefined when the user has no active request", () => {
    expect(getActiveBorrowerRequestForUser(requests, "borrower-3")).toBeUndefined();
  });
});

describe("getBorrowerRequestStatusLabel", () => {
  it("maps lending statuses to short labels", () => {
    expect(getBorrowerRequestStatusLabel("PENDING")).toBe("Pending");
    expect(getBorrowerRequestStatusLabel("APPROVED")).toBe("Approved");
    expect(getBorrowerRequestStatusLabel("BORROWED")).toBe("Borrowing");
    expect(getBorrowerRequestStatusLabel("RETURNED")).toBe("Requested");
  });
});
