import { describe, expect, it } from "vitest";

import { partitionLendingRequests } from "./lending";

describe("partitionLendingRequests", () => {
  it("shows incoming requests when the user owns the item", () => {
    const ownerId = "owner";
    const borrowerId = "borrower";

    const requests = [
      {
        id: "1",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "PENDING",
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        requesterId: ownerId,
        itemOwnerId: "someone-else",
        status: "PENDING",
        createdAt: "2024-01-02",
      },
    ];

    const { myRequests, requestsForMyItems } = partitionLendingRequests(
      requests,
      ownerId
    );

    expect(requestsForMyItems).toHaveLength(1);
    expect(requestsForMyItems[0]?.id).toBe("1");
    expect(myRequests).toHaveLength(1);
    expect(myRequests[0]?.id).toBe("2");
  });

  it("shows active incoming requests but hides returned and rejected", () => {
    const ownerId = "owner";
    const borrowerId = "borrower";

    const requests = [
      {
        id: "1",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "PENDING",
        createdAt: "2024-01-04",
      },
      {
        id: "2",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "RETURNED",
        createdAt: "2024-01-03",
      },
      {
        id: "3",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "REJECTED",
        createdAt: "2024-01-02",
      },
      {
        id: "4",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "BORROWED",
        createdAt: "2024-01-01",
      },
      {
        id: "5",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "APPROVED",
        createdAt: "2024-01-02",
      },
    ];

    const { requestsForMyItems } = partitionLendingRequests(requests, ownerId);

    expect(requestsForMyItems.map((request) => request.id)).toEqual([
      "4",
      "5",
      "1",
    ]);
  });

  it("does not show legacy self-requests in requests for my items", () => {
    const ownerId = "owner";

    const requests = [
      {
        id: "1",
        requesterId: ownerId,
        itemOwnerId: ownerId,
        status: "PENDING",
        createdAt: "2024-01-01",
      },
    ];

    const { myRequests, requestsForMyItems } = partitionLendingRequests(
      requests,
      ownerId
    );

    expect(requestsForMyItems).toHaveLength(1);
    expect(requestsForMyItems[0]?.id).toBe("1");
    expect(myRequests).toHaveLength(0);
  });

  it("does not treat the first request's requester as the logged-in user", () => {
    const ownerId = "owner";
    const borrowerId = "borrower";

    const requests = [
      {
        id: "1",
        requesterId: borrowerId,
        itemOwnerId: ownerId,
        status: "PENDING",
        createdAt: "2024-01-01",
      },
    ];

    const wrongUserId = requests[0]!.requesterId;
    const wrong = partitionLendingRequests(requests, wrongUserId);

    expect(wrong.requestsForMyItems).toHaveLength(0);

    const correct = partitionLendingRequests(requests, ownerId);
    expect(correct.requestsForMyItems).toHaveLength(1);
  });
});
