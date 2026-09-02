import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import TagDetailPage from "./tags.$tagSlug";

const loaderData = {
  tag: { id: "tag-1", name: "power tools", slug: "power-tools" },
  communityId: undefined,
  items: [
    {
      id: "item-1",
      name: "Cordless Drill",
      description: "18V with two batteries",
      photoKey: null,
      photoUrl: null,
      itemTags: [],
      owner: { id: "owner-1", email: "owner@example.com", name: "Owner" },
      primaryCommunityId: "community-1",
    },
    {
      id: "item-2",
      name: "Orphaned Hedge Trimmer",
      description: null,
      photoKey: null,
      photoUrl: null,
      itemTags: [],
      owner: { id: "owner-2", email: "other@example.com", name: "Other" },
      primaryCommunityId: null,
    },
  ],
};

vi.mock("@remix-run/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@remix-run/react")>();
  return {
    ...actual,
    useLoaderData: () => loaderData,
  };
});

describe("tag detail route", () => {
  it("links items through the community view rather than the owner-only view", () => {
    render(
      <MemoryRouter>
        <TagDetailPage />
      </MemoryRouter>
    );

    // getByRole throws if more than one matches, so this also asserts that the
    // item without a shared community renders no link.
    expect(screen.getByRole("link", { name: /view item/i })).toHaveAttribute(
      "href",
      "/communities/community-1/items/item-1"
    );
  });

  it("still lists an item that has no resolvable shared community", () => {
    render(
      <MemoryRouter>
        <TagDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Orphaned Hedge Trimmer")).toBeInTheDocument();
  });
});
