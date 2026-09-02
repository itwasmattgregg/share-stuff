import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ErrorPage from "./ErrorPage";

describe("ErrorPage", () => {
  it("shows the error copy alongside a way back into the app", () => {
    render(
      <MemoryRouter>
        <ErrorPage
          title="We couldn't find that page"
          message="The link may be out of date."
          detail="Error 404"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /couldn't find that page/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to my communities/i })
    ).toHaveAttribute("href", "/communities");
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("omits the detail line when there is no status to show", () => {
    render(
      <MemoryRouter>
        <ErrorPage title="Something went wrong" message="Please try again." />
      </MemoryRouter>
    );

    expect(screen.queryByText(/^Error /)).not.toBeInTheDocument();
  });
});
