import { vi } from "vitest";

const integrationPrisma = vi.hoisted(() => {
  const path = require("node:path") as typeof import("node:path");

  process.env.DATABASE_URL = `file:${path.join(
    process.cwd(),
    "prisma",
    "test.db"
  )}`;
  process.env.SESSION_SECRET =
    process.env.SESSION_SECRET ?? "integration-test-session-secret";

  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");

  return new PrismaClient();
});

vi.mock("~/db.server", () => ({
  prisma: integrationPrisma,
}));

vi.mock("~/models/email-verification.server", () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
}));

import type { FormHTMLAttributes, ReactNode } from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createCommunityInvite } from "~/models/community-invite.server";
import { isUserMemberOfCommunity } from "~/models/community.server";
import {
  action as browseCommunitiesAction,
  loader as browseCommunitiesLoader,
} from "~/routes/communities.browse";
import BrowseCommunitiesPage from "~/routes/communities.browse";
import {
  action as manageCommunityAction,
  loader as manageCommunityLoader,
} from "~/routes/communities.$communityId.manage";
import { loader as communityItemLoader } from "~/routes/communities.$communityId.items.$itemId._index";
import CommunityItemDetailPage from "~/routes/communities.$communityId.items.$itemId._index";
import { action as borrowRequestAction } from "~/routes/communities.$communityId.items.$itemId.request";
import {
  action as communityRequestsAction,
  loader as communityRequestsLoader,
} from "~/routes/communities.$communityId.items.$itemId.requests";
import ItemRequestsPage from "~/routes/communities.$communityId.items.$itemId.requests";
import {
  action as ownerItemAction,
  loader as ownerItemLoader,
} from "~/routes/items.$itemId._index";
import ItemDetailPage from "~/routes/items.$itemId._index";
import { action as newItemAction } from "~/routes/items.new";
import { action as joinAction } from "~/routes/join";
import JoinPage from "~/routes/join";
import { action as loginAction } from "~/routes/login";
import LoginPage from "~/routes/login";
import { loader as lendingLoader } from "~/routes/lending";
import LendingDashboardPage from "~/routes/lending";
import { action as reportAction } from "~/routes/report";

import {
  expectFormattedDateVisible,
  renderWithActionData,
  renderWithLoaderData,
} from "./render-route";
import {
  addApprovedCommunityMember,
  createAuthenticatedFormPost,
  createAuthenticatedRequest,
  createCommunityWithOwner,
  createFormPost,
  createUnverifiedUser,
  createVerifiedUser,
  ensureTestDatabase,
  invokeRouteHandler,
  prisma,
  readJsonResponse,
} from "./test-db";

vi.mock("@remix-run/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@remix-run/react")>();
  return {
    ...actual,
    Form: ({
      children,
      ...props
    }: FormHTMLAttributes<HTMLFormElement>) => (
      <form {...props}>{children}</form>
    ),
  };
});

vi.mock("~/components/ItemPhoto", () => ({
  default: () => null,
}));

vi.mock("~/components/Layout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("integration: add item flow", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("creates an item and redirects the owner to the item page", async () => {
    const owner = await createVerifiedUser({
      email: "owner-add-item@example.com",
      name: "Owner",
    });

    const { response } = await invokeRouteHandler(newItemAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        "http://localhost/items/new",
        {
          name: "Cordless Drill",
          description: "18V drill with two batteries",
          category: "Tool",
          condition: "Good",
        }
      ),
      params: {},
      context: {},
    });

    expect(response.status).toBe(302);

    const item = await prisma.item.findFirst({
      where: { ownerId: owner.id, name: "Cordless Drill" },
    });

    expect(item).not.toBeNull();
    expect(response.headers.get("Location")).toBe(`/items/${item!.id}`);

    const ownerPage = await invokeRouteHandler(ownerItemLoader, {
      request: await createAuthenticatedRequest(
        owner.id,
        `http://localhost/items/${item!.id}`
      ),
      params: { itemId: item!.id },
      context: {},
    });

    expect(ownerPage.response.status).toBe(200);

    const ownerPageData = await readJsonResponse<{ item: { name: string } }>(
      ownerPage.response
    );

    expect(ownerPageData.item.name).toBe("Cordless Drill");
  });
});

describe("integration: community item access", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("lets a community member view another member's item", async () => {
    const owner = await createVerifiedUser({
      email: "owner-community@example.com",
      name: "Owner",
    });
    const borrower = await createVerifiedUser({
      email: "borrower-community@example.com",
      name: "Borrower",
    });
    const outsider = await createVerifiedUser({
      email: "outsider-community@example.com",
      name: "Outsider",
    });

    const community = await createCommunityWithOwner({ ownerId: owner.id });
    await addApprovedCommunityMember({
      communityId: community.id,
      userId: borrower.id,
    });

    const item = await prisma.item.create({
      data: {
        name: "Shared Ladder",
        description: "8-foot ladder",
        ownerId: owner.id,
      },
    });

    const memberPage = await invokeRouteHandler(communityItemLoader, {
      request: await createAuthenticatedRequest(
        borrower.id,
        `http://localhost/communities/${community.id}/items/${item.id}`
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(memberPage.response.status).toBe(200);

    const memberData = await readJsonResponse<{
      item: { name: string };
      isOwner: boolean;
    }>(memberPage.response);

    expect(memberData.item.name).toBe("Shared Ladder");
    expect(memberData.isOwner).toBe(false);

    renderWithLoaderData(<CommunityItemDetailPage />, memberData);

    expect(
      screen.getByRole("heading", { name: /shared ladder/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/shared by owner/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^request$/i })).toHaveAttribute(
      "href",
      `/communities/${community.id}/items/${item.id}/request`
    );

    const outsiderPage = await invokeRouteHandler(communityItemLoader, {
      request: await createAuthenticatedRequest(
        outsider.id,
        `http://localhost/communities/${community.id}/items/${item.id}`
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(outsiderPage.response.status).toBe(403);
  });
});

describe("integration: lending lifecycle", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("supports request, approval, borrow, return, and formatted dates", async () => {
    const requestCreatedAt = new Date("2025-06-15T14:30:00.000Z");

    const owner = await createVerifiedUser({
      email: "owner-lending@example.com",
      name: "Taylor Owner",
    });
    const borrower = await createVerifiedUser({
      email: "borrower-lending@example.com",
      name: "Jamie Borrower",
    });

    const community = await createCommunityWithOwner({
      ownerId: owner.id,
      name: "Lending Community",
    });
    await addApprovedCommunityMember({
      communityId: community.id,
      userId: borrower.id,
    });

    const item = await prisma.item.create({
      data: {
        name: "Camping Tent",
        description: "Four-person tent",
        ownerId: owner.id,
      },
    });

    const requestAction = await invokeRouteHandler(borrowRequestAction, {
      request: await createAuthenticatedFormPost(
        borrower.id,
        `http://localhost/communities/${community.id}/items/${item.id}/request`,
        {
          requestNote: "Need it for a weekend trip",
        }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(requestAction.response.status).toBe(302);

    const lendingRequest = await prisma.lendingRequest.findFirstOrThrow({
      where: {
        itemId: item.id,
        requesterId: borrower.id,
      },
    });

    await prisma.lendingRequest.update({
      where: { id: lendingRequest.id },
      data: { createdAt: requestCreatedAt },
    });

    const borrowerDashboard = await invokeRouteHandler(lendingLoader, {
      request: await createAuthenticatedRequest(
        borrower.id,
        "http://localhost/lending"
      ),
      params: {},
      context: {},
    });
    const borrowerDashboardData = await readJsonResponse<{
      requests: Array<{ status: string; createdAt: string }>;
      userId: string;
    }>(borrowerDashboard.response);

    expect(borrowerDashboardData.requests).toHaveLength(1);
    expect(borrowerDashboardData.requests[0]?.status).toBe("PENDING");

    renderWithLoaderData(<LendingDashboardPage />, borrowerDashboardData);
    expect(screen.getByText(/camping tent/i)).toBeInTheDocument();
    expectFormattedDateVisible(requestCreatedAt);
    expect(screen.getByText(/need it for a weekend trip/i)).toBeInTheDocument();

    const approveAction = await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        {
          requestId: lendingRequest.id,
          status: "APPROVED",
        }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(approveAction.response.status).toBe(302);

    let itemRecord = await prisma.item.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(itemRecord.isAvailable).toBe(false);

    const borrowAction = await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        {
          requestId: lendingRequest.id,
          status: "BORROWED",
        }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(borrowAction.response.status).toBe(302);

    const ownerRequestsPage = await invokeRouteHandler(communityRequestsLoader, {
      request: await createAuthenticatedRequest(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });
    const ownerRequestsData = await readJsonResponse<{
      item: {
        lendingRequests: Array<{
          status: string;
          createdAt: string;
          requestNote: string | null;
        }>;
      };
    }>(ownerRequestsPage.response);

    renderWithLoaderData(<ItemRequestsPage />, ownerRequestsData);
    expect(screen.getByText(/currently borrowed/i)).toBeInTheDocument();
    expectFormattedDateVisible(requestCreatedAt);
    expect(screen.getByText(/need it for a weekend trip/i)).toBeInTheDocument();

    const returnAction = await invokeRouteHandler(ownerItemAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/items/${item.id}`,
        {
          requestId: lendingRequest.id,
          status: "RETURNED",
        }
      ),
      params: { itemId: item.id },
      context: {},
    });

    expect(returnAction.response.status).toBe(302);

    itemRecord = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(itemRecord.isAvailable).toBe(true);

    const returnedRequest = await prisma.lendingRequest.findUniqueOrThrow({
      where: { id: lendingRequest.id },
    });
    expect(returnedRequest.status).toBe("RETURNED");

    const completedRequestsPage = await invokeRouteHandler(
      communityRequestsLoader,
      {
        request: await createAuthenticatedRequest(
          owner.id,
          `http://localhost/communities/${community.id}/items/${item.id}/requests`
        ),
        params: { communityId: community.id, itemId: item.id },
        context: {},
      }
    );
    const completedRequestsData = await readJsonResponse<typeof ownerRequestsData>(
      completedRequestsPage.response
    );

    renderWithLoaderData(<ItemRequestsPage />, completedRequestsData);
    expect(screen.getByText(/completed requests/i)).toBeInTheDocument();
    expect(screen.getByText(/returned on/i)).toBeInTheDocument();
    expectFormattedDateVisible(requestCreatedAt);

    const ownerItemPage = await invokeRouteHandler(ownerItemLoader, {
      request: await createAuthenticatedRequest(
        owner.id,
        `http://localhost/items/${item.id}`
      ),
      params: { itemId: item.id },
      context: {},
    });
    const ownerItemData = await readJsonResponse<{
      item: { isAvailable: boolean; lendingRequests: Array<{ status: string }> };
    }>(ownerItemPage.response);

    expect(ownerItemData.item.isAvailable).toBe(true);
    expect(
      ownerItemData.item.lendingRequests.every(
        (request) => request.status !== "BORROWED"
      )
    ).toBe(true);

    renderWithLoaderData(<ItemDetailPage />, ownerItemData);
    expect(screen.getByText(/^available$/i)).toBeInTheDocument();
  });
});

describe("integration: login", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("blocks unverified users and shows a verification message", async () => {
    await createUnverifiedUser({
      email: "unverified@example.com",
      name: "Unverified User",
      password: "password123",
    });

    const { response } = await invokeRouteHandler(loginAction, {
      request: await createFormPost("http://localhost/login", {
        email: "unverified@example.com",
        password: "password123",
        redirectTo: "/communities",
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(400);

    const actionData = await readJsonResponse<{
      errors: { email: string | null };
      unverifiedEmail?: string;
    }>(response);

    expect(actionData.errors.email).toMatch(/verify your email/i);
    expect(actionData.unverifiedEmail).toBe("unverified@example.com");

    renderWithActionData(<LoginPage />, actionData);
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resend verification email/i }))
      .toHaveAttribute("href", "/verify-email?email=unverified%40example.com");
  });

  it("creates a session for verified users", async () => {
    const user = await createVerifiedUser({
      email: "verified-login@example.com",
      password: "password123",
    });

    const { response } = await invokeRouteHandler(loginAction, {
      request: await createFormPost("http://localhost/login", {
        email: "verified-login@example.com",
        password: "password123",
        redirectTo: "/communities",
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/communities");
    expect(response.headers.get("Set-Cookie")).toMatch(/__session=/);

    const communitiesPage = await invokeRouteHandler(browseCommunitiesLoader, {
      request: new Request("http://localhost/communities/browse", {
        headers: { Cookie: response.headers.get("Set-Cookie") ?? "" },
      }),
      params: {},
      context: {},
    });

    expect(communitiesPage.response.status).toBe(200);
    expect(user.id).toBeTruthy();
  });
});

describe("integration: signup with invite", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("joins the invited community before email verification", async () => {
    const owner = await createVerifiedUser({
      email: "invite-owner@example.com",
      name: "Invite Owner",
    });
    const community = await createCommunityWithOwner({
      ownerId: owner.id,
      name: "Invite Community",
    });
    const invite = await createCommunityInvite({
      communityId: community.id,
      createdById: owner.id,
    });

    const { response } = await invokeRouteHandler(joinAction, {
      request: await createFormPost("http://localhost/join", {
        name: "Invited User",
        email: "invited-user@example.com",
        password: "password123",
        redirectTo: `/invite/${invite.token}`,
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(200);

    const actionData = await readJsonResponse<{
      submitted: boolean;
      email: string;
      communityJoined: boolean;
    }>(response);

    expect(actionData.submitted).toBe(true);
    expect(actionData.communityJoined).toBe(true);

    const newUser = await prisma.user.findUniqueOrThrow({
      where: { email: "invited-user@example.com" },
    });
    expect(newUser.emailVerifiedAt).toBeNull();

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: newUser.id,
          communityId: community.id,
        },
      },
    });

    expect(membership?.status).toBe("APPROVED");

    renderWithActionData(<JoinPage />, actionData);
    expect(screen.getByText(/verification link/i)).toBeInTheDocument();
    expect(
      screen.getByText(/community you were invited to will appear/i)
    ).toBeInTheDocument();
  });
});

describe("integration: browse and join community", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("lets a user request to join and an owner approve the membership", async () => {
    const owner = await createVerifiedUser({
      email: "browse-owner@example.com",
      name: "Browse Owner",
    });
    const requester = await createVerifiedUser({
      email: "browse-requester@example.com",
      name: "Browse Requester",
    });
    const community = await createCommunityWithOwner({
      ownerId: owner.id,
      name: "Listed Community",
    });

    const browseData = await invokeRouteHandler(browseCommunitiesLoader, {
      request: await createAuthenticatedRequest(
        requester.id,
        "http://localhost/communities/browse"
      ),
      params: {},
      context: {},
    });
    const browseLoaderData = await readJsonResponse<{
      communities: Array<{ id: string; name: string; memberships: Array<{ status: string }> }>;
      userId: string;
    }>(browseData.response);

    expect(browseLoaderData.communities).toHaveLength(1);
    expect(browseLoaderData.communities[0]?.name).toBe("Listed Community");

    renderWithLoaderData(<BrowseCommunitiesPage />, browseLoaderData);
    expect(
      screen.getByRole("button", { name: /request to join/i })
    ).toBeInTheDocument();

    const joinRequest = await invokeRouteHandler(browseCommunitiesAction, {
      request: await createAuthenticatedFormPost(
        requester.id,
        "http://localhost/communities/browse",
        { communityId: community.id }
      ),
      params: {},
      context: {},
    });

    expect(joinRequest.response.status).toBe(302);

    const pendingMembership = await prisma.communityMembership.findUniqueOrThrow({
      where: {
        userId_communityId: {
          userId: requester.id,
          communityId: community.id,
        },
      },
    });
    expect(pendingMembership.status).toBe("PENDING");

    const pendingBrowse = await invokeRouteHandler(browseCommunitiesLoader, {
      request: await createAuthenticatedRequest(
        requester.id,
        "http://localhost/communities/browse"
      ),
      params: {},
      context: {},
    });
    const pendingBrowseData = await readJsonResponse<typeof browseLoaderData>(
      pendingBrowse.response
    );

    renderWithLoaderData(<BrowseCommunitiesPage />, pendingBrowseData);
    expect(screen.getByText(/^pending$/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument();

    const manageData = await invokeRouteHandler(manageCommunityLoader, {
      request: await createAuthenticatedRequest(
        owner.id,
        `http://localhost/communities/${community.id}/manage`
      ),
      params: { communityId: community.id },
      context: {},
    });
    const manageLoaderData = await readJsonResponse<{
      pendingMemberships: Array<{ id: string; user: { name: string | null } }>;
    }>(manageData.response);

    expect(manageLoaderData.pendingMemberships).toHaveLength(1);
    expect(manageLoaderData.pendingMemberships[0]?.user.name).toBe(
      "Browse Requester"
    );

    const approveAction = await invokeRouteHandler(manageCommunityAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/manage`,
        {
          membershipId: pendingMembership.id,
          status: "APPROVED",
        }
      ),
      params: { communityId: community.id },
      context: {},
    });

    expect(approveAction.response.status).toBe(302);

    await expect(
      isUserMemberOfCommunity({
        userId: requester.id,
        communityId: community.id,
      })
    ).resolves.toBe(true);

    const notification = await prisma.notification.findFirst({
      where: {
        userId: requester.id,
        type: "COMMUNITY_APPROVED",
      },
    });

    expect(notification?.message).toMatch(/listed community/i);
  });
});

describe("integration: reject lending request", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("rejects a pending request and notifies the borrower", async () => {
    const owner = await createVerifiedUser({
      email: "reject-owner@example.com",
      name: "Reject Owner",
    });
    const borrower = await createVerifiedUser({
      email: "reject-borrower@example.com",
      name: "Reject Borrower",
    });
    const community = await createCommunityWithOwner({ ownerId: owner.id });
    await addApprovedCommunityMember({
      communityId: community.id,
      userId: borrower.id,
    });

    const item = await prisma.item.create({
      data: {
        name: "Rejected Item",
        ownerId: owner.id,
      },
    });

    await invokeRouteHandler(borrowRequestAction, {
      request: await createAuthenticatedFormPost(
        borrower.id,
        `http://localhost/communities/${community.id}/items/${item.id}/request`,
        { requestNote: "Can I borrow this?" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    const lendingRequest = await prisma.lendingRequest.findFirstOrThrow({
      where: { itemId: item.id, requesterId: borrower.id },
    });

    const rejectAction = await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        {
          requestId: lendingRequest.id,
          status: "REJECTED",
          responseNote: "Not available this month",
        }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    expect(rejectAction.response.status).toBe(302);

    const updatedRequest = await prisma.lendingRequest.findUniqueOrThrow({
      where: { id: lendingRequest.id },
    });
    expect(updatedRequest.status).toBe("REJECTED");
    expect(updatedRequest.responseNote).toBe("Not available this month");

    const notification = await prisma.notification.findFirst({
      where: {
        userId: borrower.id,
        type: "LENDING_REJECTED",
      },
    });
    expect(notification?.message).toMatch(/rejected item/i);

    const borrowerDashboard = await invokeRouteHandler(lendingLoader, {
      request: await createAuthenticatedRequest(
        borrower.id,
        "http://localhost/lending"
      ),
      params: {},
      context: {},
    });
    const borrowerDashboardData = await readJsonResponse<{
      requests: Array<{ status: string }>;
      userId: string;
    }>(borrowerDashboard.response);

    renderWithLoaderData(<LendingDashboardPage />, borrowerDashboardData);
    expect(screen.getByText(/^rejected$/i)).toBeInTheDocument();
    expect(screen.getByText(/owner response/i)).toBeInTheDocument();
    expect(screen.getByText(/not available this month/i)).toBeInTheDocument();
  });
});

describe("integration: lending queue", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("allows a queued borrower to be approved after the item is returned", async () => {
    const owner = await createVerifiedUser({
      email: "queue-owner@example.com",
      name: "Queue Owner",
    });
    const firstBorrower = await createVerifiedUser({
      email: "queue-borrower-1@example.com",
      name: "First Borrower",
    });
    const queuedBorrower = await createVerifiedUser({
      email: "queue-borrower-2@example.com",
      name: "Queued Borrower",
    });
    const community = await createCommunityWithOwner({ ownerId: owner.id });
    await addApprovedCommunityMember({
      communityId: community.id,
      userId: firstBorrower.id,
    });
    await addApprovedCommunityMember({
      communityId: community.id,
      userId: queuedBorrower.id,
    });

    const item = await prisma.item.create({
      data: {
        name: "Queued Blender",
        ownerId: owner.id,
      },
    });

    const firstRequestAction = await invokeRouteHandler(borrowRequestAction, {
      request: await createAuthenticatedFormPost(
        firstBorrower.id,
        `http://localhost/communities/${community.id}/items/${item.id}/request`,
        {}
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });
    expect(firstRequestAction.response.status).toBe(302);

    const firstRequest = await prisma.lendingRequest.findFirstOrThrow({
      where: { itemId: item.id, requesterId: firstBorrower.id },
    });

    await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        { requestId: firstRequest.id, status: "APPROVED" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        { requestId: firstRequest.id, status: "BORROWED" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    let itemRecord = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(itemRecord.isAvailable).toBe(false);

    const queueRequestAction = await invokeRouteHandler(borrowRequestAction, {
      request: await createAuthenticatedFormPost(
        queuedBorrower.id,
        `http://localhost/communities/${community.id}/items/${item.id}/request`,
        { requestNote: "Happy to wait in line" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });
    expect(queueRequestAction.response.status).toBe(302);

    const queuedRequest = await prisma.lendingRequest.findFirstOrThrow({
      where: { itemId: item.id, requesterId: queuedBorrower.id },
    });
    expect(queuedRequest.status).toBe("PENDING");

    await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        { requestId: firstRequest.id, status: "RETURNED" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });

    itemRecord = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(itemRecord.isAvailable).toBe(true);

    const approveQueuedAction = await invokeRouteHandler(communityRequestsAction, {
      request: await createAuthenticatedFormPost(
        owner.id,
        `http://localhost/communities/${community.id}/items/${item.id}/requests`,
        { requestId: queuedRequest.id, status: "APPROVED" }
      ),
      params: { communityId: community.id, itemId: item.id },
      context: {},
    });
    expect(approveQueuedAction.response.status).toBe(302);

    itemRecord = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(itemRecord.isAvailable).toBe(false);

    const approvedQueued = await prisma.lendingRequest.findUniqueOrThrow({
      where: { id: queuedRequest.id },
    });
    expect(approvedQueued.status).toBe("APPROVED");

    const queueCreatedAt = new Date("2025-07-04T16:00:00.000Z");
    await prisma.lendingRequest.update({
      where: { id: queuedRequest.id },
      data: { createdAt: queueCreatedAt },
    });

    const queuedBorrowerDashboard = await invokeRouteHandler(lendingLoader, {
      request: await createAuthenticatedRequest(
        queuedBorrower.id,
        "http://localhost/lending"
      ),
      params: {},
      context: {},
    });
    const queuedBorrowerData = await readJsonResponse<{
      requests: Array<{ status: string }>;
      userId: string;
    }>(queuedBorrowerDashboard.response);

    renderWithLoaderData(<LendingDashboardPage />, queuedBorrowerData);
    expect(screen.getByText(/queued blender/i)).toBeInTheDocument();
    expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    expectFormattedDateVisible(queueCreatedAt);
    expect(screen.getByText(/happy to wait in line/i)).toBeInTheDocument();
  });
});

describe("integration: report submission", () => {
  beforeEach(async () => {
    await ensureTestDatabase();
  });

  it("creates a report with default metadata and redirects to success", async () => {
    const reporter = await createVerifiedUser({
      email: "reporter@example.com",
      name: "Reporter",
    });

    const { response } = await invokeRouteHandler(reportAction, {
      request: await createAuthenticatedFormPost(
        reporter.id,
        "http://localhost/report",
        {
          reason: "Spam or unsolicited messages",
          description: "User keeps posting commercial links in the community.",
          evidence: "Screenshot saved locally",
        }
      ),
      params: {},
      context: {},
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/report/success");

    const report = await prisma.report.findFirstOrThrow({
      where: { reporterId: reporter.id },
    });

    expect(report.reason).toBe("Spam or unsolicited messages");
    expect(report.description).toMatch(/commercial links/i);
    expect(report.evidence).toBe("Screenshot saved locally");
    expect(report.reportType).toBe("GENERAL");
    expect(report.targetId).toBe("unspecified");
    expect(report.status).toBe("PENDING");
  });

  it("returns validation errors when required fields are missing", async () => {
    const reporter = await createVerifiedUser({
      email: "reporter-invalid@example.com",
    });

    const { response } = await invokeRouteHandler(reportAction, {
      request: await createAuthenticatedFormPost(
        reporter.id,
        "http://localhost/report",
        {
          reason: "",
          description: "",
        }
      ),
      params: {},
      context: {},
    });

    expect(response.status).toBe(400);

    const actionData = await readJsonResponse<{
      errors: { reason?: string; description?: string };
    }>(response);

    expect(actionData.errors.reason).toMatch(/select a reason/i);
    expect(actionData.errors.description).toMatch(/provide a description/i);

    const reportCount = await prisma.report.count({
      where: { reporterId: reporter.id },
    });
    expect(reportCount).toBe(0);
  });
});
