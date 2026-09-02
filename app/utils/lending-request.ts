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

export function lendingRequestStatusConfirmation({
  status,
  requesterName,
  itemName,
}: {
  status: LendingStatus;
  requesterName: string;
  itemName: string;
}) {
  switch (status) {
    case "APPROVED":
      return `Approved ${requesterName}'s request. They've been notified that ${itemName} is ready to collect.`;
    case "REJECTED":
      return `Declined ${requesterName}'s request for ${itemName}.`;
    case "BORROWED":
      return `${itemName} is now marked as borrowed by ${requesterName}.`;
    case "RETURNED":
      return `${itemName} is marked as returned. Thanks for keeping it up to date.`;
    default:
      return `Updated ${requesterName}'s request for ${itemName}.`;
  }
}

export function getBorrowerRequestStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "BORROWED":
      return "Borrowing";
    default:
      return "Requested";
  }
}
