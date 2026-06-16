import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CommunityItemDetailPage from "./communities.$communityId.items.$itemId._index";

const baseItem = {
  id: "item-1",
  name: "Community Drill",
  description: "Cordless drill",
  category: "Tools",
  condition: "Good",
  isAvailable: true,
  photoKey: null,
  ownerId: "owner-1",
  lendingRequests: [],
  owner: {
    id: "owner-1",
    email: "owner@example.com",
    name: "Owner",
  },
};

vi.mock("~/components/ItemPhoto", () => ({
  default: ({ alt }: { alt: string }) => <div data-testid="item-photo">{alt}</div>,
}));

const mockUseLoaderData = vi.fn();

vi.mock("@remix-run/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@remix-run/react")>();
  return {
    ...actual,
    useLoaderData: () => mockUseLoaderData(),
  };
});

describe("community item detail route", () => {
  it("lets non-owners view details and request the item", () => {
    mockUseLoaderData.mockReturnValue({
      item: baseItem,
      communityId: "community-1",
      userId: "borrower-1",
      isOwner: false,
    });

    render(
      <MemoryRouter>
        <CommunityItemDetailPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /community drill/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/shared by owner/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^request$/i })
    ).toHaveAttribute(
      "href",
      "/communities/community-1/items/item-1/request"
    );
    expect(screen.queryByRole("link", { name: /manage item/i })).not.toBeInTheDocument();
  });

  it("shows owner management links instead of a borrow request", () => {
    mockUseLoaderData.mockReturnValue({
      item: baseItem,
      communityId: "community-1",
      userId: "owner-1",
      isOwner: true,
    });

    render(
      <MemoryRouter>
        <CommunityItemDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /manage item/i })).toHaveAttribute(
      "href",
      "/items/item-1"
    );
    expect(screen.getByRole("link", { name: /view requests/i })).toHaveAttribute(
      "href",
      "/communities/community-1/items/item-1/requests"
    );
    expect(
      screen.queryByRole("link", { name: /^request$/i })
    ).not.toBeInTheDocument();
  });
});
