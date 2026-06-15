import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Index from "./_index";
import * as utils from "~/utils";

vi.mock("~/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils")>();
  return {
    ...actual,
    useOptionalUser: vi.fn(),
  };
});

const mockUser = {
  id: "user-1",
  email: "member@example.com",
  name: "Member",
  role: "USER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("home page", () => {
  beforeEach(() => {
    vi.mocked(utils.useOptionalUser).mockReturnValue(undefined);
  });

  it("shows sign up and sign in links for guests", () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/join"
    );
    expect(screen.getAllByRole("link", { name: /sign in/i })[0]).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("shows communities link for logged-in users", () => {
    vi.mocked(utils.useOptionalUser).mockReturnValue(mockUser);

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("link", { name: /get started/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to my communities/i })
    ).toHaveAttribute("href", "/communities");
  });
});
