import { Link } from "@remix-run/react";

import {
  getActiveBorrowerRequestForUser,
  getBorrowerRequestStatusLabel,
} from "~/utils/lending-request";

type CommunityItemRequestLinkProps = {
  itemId: string;
  communityId: string;
  ownerId: string;
  userId: string;
  isAvailable: boolean;
  lendingRequests: Array<{ requesterId: string; status: string }>;
  className?: string;
};

export default function CommunityItemRequestLink({
  itemId,
  communityId,
  ownerId,
  userId,
  isAvailable,
  lendingRequests,
  className = "flex-1 rounded-lg px-4 py-3 text-center text-base font-medium shadow-md transition-colors min-h-[44px] flex items-center justify-center",
}: CommunityItemRequestLinkProps) {
  if (ownerId === userId) {
    return null;
  }

  const activeRequest = getActiveBorrowerRequestForUser(
    lendingRequests,
    userId
  );

  if (activeRequest) {
    return (
      <Link
        to="/lending"
        className={`${className} bg-neutral-100 text-neutral-800 hover:bg-neutral-200`}
      >
        {getBorrowerRequestStatusLabel(activeRequest.status)}
      </Link>
    );
  }

  return (
    <Link
      to={`/communities/${communityId}/items/${itemId}/request`}
      className={`${className} text-white hover:opacity-90 ${
        isAvailable
          ? "bg-green-500 hover:bg-green-600"
          : "bg-yellow-500 hover:bg-yellow-600"
      }`}
    >
      {isAvailable ? "Request" : "Join Queue"}
    </Link>
  );
}
