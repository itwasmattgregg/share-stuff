export type LendingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "BORROWED"
  | "RETURNED";

export const ACTIVE_BORROWER_REQUEST_STATUSES: LendingStatus[] = [
  "PENDING",
  "APPROVED",
  "BORROWED",
];

export function getActiveBorrowerRequestForUser<
  T extends { requesterId: string; status: string },
>(lendingRequests: T[], userId: string) {
  return lendingRequests.find(
    (request) =>
      request.requesterId === userId &&
      ACTIVE_BORROWER_REQUEST_STATUSES.includes(
        request.status as LendingStatus
      )
  );
}

export function getBorrowerRequestStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Request pending";
    case "APPROVED":
      return "Approved";
    case "BORROWED":
      return "Borrowing";
    default:
      return "Requested";
  }
}
