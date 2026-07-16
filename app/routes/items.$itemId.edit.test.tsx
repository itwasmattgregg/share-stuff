import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import EditItemPage from "./items.$itemId.edit";

const mockItem = {
  id: "item-1",
  name: "Hammer",
  description: "A sturdy hammer",
  category: "Tool",
  condition: "Good",
  photoKey: null,
  isAvailable: true,
  ownerId: "user-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  itemTags: [
    {
      itemId: "item-1",
      tagId: "tag-1",
      tag: {
        id: "tag-1",
        name: "DIY",
        slug: "diy",
        createdAt: new Date("2024-01-01"),
      },
    },
  ],
};

vi.mock("@remix-run/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@remix-run/react")>();
  return {
    ...actual,
    Form: ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
      <form {...props}>{children}</form>
    ),
    useLoaderData: () => ({ item: mockItem, photoUploadEnabled: false }),
    useActionData: () => undefined,
  };
});

describe("item edit route", () => {
  it("renders the edit form with existing item values", () => {
    render(
      <MemoryRouter>
        <EditItemPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /edit item/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /item name/i })).toHaveValue(
      "Hammer"
    );
    expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue(
      "A sturdy hammer"
    );
    expect(
      screen.getByRole("button", { name: /update item/i })
    ).toBeInTheDocument();
    expect(screen.getByText("DIY")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/items/item-1"
    );
  });
});
