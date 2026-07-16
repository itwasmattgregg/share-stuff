import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ItemDetailPage from "./items.$itemId._index";

const mockItem = {
  id: "item-1",
  name: "Sample Bookie",
  description: "A good read",
  category: "Books",
  condition: "Good",
  isAvailable: false,
  ownerId: "owner-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  itemTags: [],
  owner: {
    id: "owner-1",
    email: "owner@example.com",
    name: "Owner",
  },
  lendingRequests: [
    {
      id: "request-borrowed",
      status: "BORROWED",
      requestNote: "Need it for the weekend",
      responseNote: null,
      createdAt: new Date("2024-01-02"),
      requester: {
        id: "borrower-1",
        email: "borrower@example.com",
        name: "Borrower",
      },
    },
    {
      id: "request-pending",
      status: "PENDING",
      requestNote: "Next in line",
      responseNote: null,
      createdAt: new Date("2024-01-03"),
      requester: {
        id: "borrower-2",
        email: "queue@example.com",
        name: "Queue User",
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
    useLoaderData: () => ({ item: mockItem }),
  };
});

describe("item detail route", () => {
  it("shows owner actions to mark returned and reject queued requests", () => {
    render(
      <MemoryRouter>
        <ItemDetailPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /mark as returned/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
    expect(screen.getByText(/queue \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/currently borrowed by borrower/i)).toBeInTheDocument();
  });
});
