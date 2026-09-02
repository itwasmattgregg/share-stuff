import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ItemsPage from "./items";

const loaderData = {
  tags: [],
  popularTags: [],
  items: [
    {
      id: "item-1",
      name: "Cordless Drill",
      description: "18V with two batteries",
      category: "Tools",
      condition: "Good",
      isAvailable: true,
      photoKey: null,
      photoUrl: null,
      itemTags: [],
    },
    {
      id: "item-2",
      name: "Pasta Maker",
      description: null,
      category: null,
      condition: null,
      isAvailable: false,
      photoKey: null,
      photoUrl: null,
      itemTags: [],
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

vi.mock("~/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils")>();
  return {
    ...actual,
    useOptionalUser: vi.fn(() => undefined),
    useMatchesData: vi.fn(() => ({})),
  };
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ItemsPage />
    </MemoryRouter>
  );
}

describe("my items route", () => {
  it("lists every item on the index, so the list is reachable on small screens", () => {
    renderAt("/items");

    expect(screen.getByText("Cordless Drill")).toBeInTheDocument();
    expect(screen.getByText("Pasta Maker")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /all items/i })
    ).not.toBeInTheDocument();
  });

  it("offers a way back to the list when viewing a single item", () => {
    renderAt("/items/item-1");

    expect(screen.getByRole("link", { name: /all items/i })).toHaveAttribute(
      "href",
      "/items"
    );
  });

  it("keeps active tag filters when returning to the list", () => {
    renderAt("/items/item-1?tag=tools");

    expect(screen.getByRole("link", { name: /all items/i })).toHaveAttribute(
      "href",
      "/items?tag=tools"
    );
  });
});
