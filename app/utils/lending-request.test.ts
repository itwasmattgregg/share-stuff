import { describe, expect, it } from "vitest";

import {
  getActiveBorrowerRequestForUser,
  getBorrowerRequestStatusLabel,
  getItemLendingDisplay,
  getPendingRequestsOldestFirst,
  getQueuePositionForUser,
  parseOptionalDueDate,
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

  it("ignores returned, rejected, and cancelled requests", () => {
    const inactive = [
      { requesterId: "borrower-1", status: "RETURNED" },
      { requesterId: "borrower-1", status: "REJECTED" },
      { requesterId: "borrower-1", status: "CANCELLED" },
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
    expect(getBorrowerRequestStatusLabel("APPROVED")).toBe("Ready for pickup");
    expect(getBorrowerRequestStatusLabel("BORROWED")).toBe("Borrowing");
    expect(getBorrowerRequestStatusLabel("CANCELLED")).toBe("Cancelled");
    expect(getBorrowerRequestStatusLabel("RETURNED")).toBe("Returned");
  });
});

describe("queue helpers", () => {
  const requests = [
    {
      requesterId: "borrower-2",
      status: "PENDING",
      createdAt: "2024-01-03T00:00:00.000Z",
    },
    {
      requesterId: "borrower-1",
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      requesterId: "borrower-3",
      status: "APPROVED",
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  it("orders the pending queue oldest first", () => {
    expect(getPendingRequestsOldestFirst(requests).map((r) => r.requesterId)).toEqual([
      "borrower-1",
      "borrower-2",
    ]);
  });

  it("returns a 1-based queue position for the current user", () => {
    expect(getQueuePositionForUser(requests, "borrower-2")).toEqual({
      position: 2,
      total: 2,
    });
  });
});

describe("getItemLendingDisplay", () => {
  it("prefers borrowed over ready-for-pickup and queue labels", () => {
    expect(
      getItemLendingDisplay(
        [{ status: "BORROWED" }, { status: "PENDING" }],
        true
      )
    ).toMatchObject({ label: "Borrowed", tone: "borrowed" });
  });

  it("shows ready for pickup when approved", () => {
    expect(getItemLendingDisplay([{ status: "APPROVED" }], true)).toMatchObject({
      label: "Ready for pickup",
      tone: "ready",
    });
  });

  it("shows queue depth when only pending requests remain", () => {
    expect(
      getItemLendingDisplay([{ status: "PENDING" }, { status: "PENDING" }], true)
    ).toMatchObject({ label: "2 in queue", tone: "queued" });
  });

  it("respects an owner taking the item off the shelf", () => {
    expect(getItemLendingDisplay([], false)).toMatchObject({
      label: "Unavailable",
      tone: "borrowed",
    });
  });
});

describe("parseOptionalDueDate", () => {
  it("accepts blank values as unset", () => {
    expect(parseOptionalDueDate("")).toBeNull();
    expect(parseOptionalDueDate(null)).toBeNull();
  });

  it("parses a calendar date as midday UTC", () => {
    const parsed = parseOptionalDueDate("2026-09-15");
    expect(parsed).toBeInstanceOf(Date);
    expect((parsed as Date).toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("rejects malformed dates", () => {
    expect(parseOptionalDueDate("15/09/2026")).toBe("invalid");
    expect(parseOptionalDueDate("not-a-date")).toBe("invalid");
  });
});
