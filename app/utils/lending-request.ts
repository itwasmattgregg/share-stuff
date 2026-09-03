export type LendingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "BORROWED"
  | "RETURNED"
  | "CANCELLED";

/** Statuses that mean the borrower still has a stake in this item. */
export const ACTIVE_BORROWER_REQUEST_STATUSES: LendingStatus[] = [
  "PENDING",
  "APPROVED",
  "BORROWED",
];

/** Statuses that keep the item off the "Available" shelf. */
export const UNAVAILABLE_LENDING_STATUSES: LendingStatus[] = [
  "PENDING",
  "APPROVED",
  "BORROWED",
];

/** At most one of these may exist per item at a time. */
export const HOLDER_LENDING_STATUSES: LendingStatus[] = [
  "APPROVED",
  "BORROWED",
];

export type ItemLendingDisplay = {
  label: string;
  tone: "available" | "queued" | "ready" | "borrowed";
  pendingCount: number;
};

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

export function getPendingRequestsOldestFirst<
  T extends { status: string; createdAt: Date | string },
>(lendingRequests: T[]) {
  return lendingRequests
    .filter((request) => request.status === "PENDING")
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
}

export function getQueuePositionForUser<
  T extends { requesterId: string; status: string; createdAt: Date | string },
>(lendingRequests: T[], userId: string) {
  const pending = getPendingRequestsOldestFirst(lendingRequests);
  const index = pending.findIndex((request) => request.requesterId === userId);
  if (index < 0) {
    return null;
  }

  return {
    position: index + 1,
    total: pending.length,
  };
}

export function getItemLendingDisplay(
  lendingRequests: Array<{ status: string }>,
  isAvailable = true
): ItemLendingDisplay {
  const pendingCount = lendingRequests.filter(
    (request) => request.status === "PENDING"
  ).length;
  const hasBorrowed = lendingRequests.some(
    (request) => request.status === "BORROWED"
  );
  const hasApproved = lendingRequests.some(
    (request) => request.status === "APPROVED"
  );

  if (hasBorrowed) {
    return { label: "Borrowed", tone: "borrowed", pendingCount };
  }

  if (hasApproved) {
    return { label: "Ready for pickup", tone: "ready", pendingCount };
  }

  if (pendingCount > 0) {
    return {
      label: pendingCount === 1 ? "1 in queue" : `${pendingCount} in queue`,
      tone: "queued",
      pendingCount,
    };
  }

  if (!isAvailable) {
    return { label: "Unavailable", tone: "borrowed", pendingCount: 0 };
  }

  return { label: "Available", tone: "available", pendingCount: 0 };
}

export function itemLendingBadgeClassName(tone: ItemLendingDisplay["tone"]) {
  switch (tone) {
    case "available":
      return "bg-success-100 text-success-800";
    case "queued":
      return "bg-warning-100 text-warning-800";
    case "ready":
      return "bg-primary-100 text-primary-800";
    case "borrowed":
      return "bg-danger-100 text-danger-800";
  }
}

export function getBorrowerRequestStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Ready for pickup";
    case "BORROWED":
      return "Borrowing";
    case "CANCELLED":
      return "Cancelled";
    case "RETURNED":
      return "Returned";
    case "REJECTED":
      return "Declined";
    default:
      return "Requested";
  }
}

export function parseOptionalDueDate(
  value: FormDataEntryValue | null | undefined
): Date | null | "invalid" {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "invalid";
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }

  return date;
}

export function formatDueDate(date: Date | string) {
  return new Date(date).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDueDateInputValue(date: Date | string | null | undefined) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 10);
}
