import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FlashBanner from "./FlashBanner";

describe("FlashBanner", () => {
  it("announces a success message as a status region", () => {
    render(
      <FlashBanner flashMessage={{ tone: "success", text: "Changes saved." }} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Changes saved.");
  });

  it("announces an error as an alert", () => {
    render(
      <FlashBanner
        flashMessage={{
          tone: "error",
          text: "You already have an active request.",
        }}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You already have an active request."
    );
  });

  it("hides the banner after the user dismisses it", async () => {
    const user = userEvent.setup();

    render(
      <FlashBanner flashMessage={{ tone: "success", text: "Changes saved." }} />
    );

    await user.click(screen.getByRole("button", { name: /dismiss message/i }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no message", () => {
    const { container } = render(<FlashBanner flashMessage={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
