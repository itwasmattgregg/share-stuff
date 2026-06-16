import { cleanup, render, screen } from "@testing-library/react";
import * as remixReact from "@remix-run/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { afterEach, expect, vi } from "vitest";

import { formatLendingRequestDateTime } from "~/utils";

let useLoaderDataSpy: ReturnType<typeof vi.spyOn> | undefined;

afterEach(() => {
  useLoaderDataSpy?.mockRestore();
  useLoaderDataSpy = undefined;
  cleanup();
});

export function renderWithActionData(
  ui: ReactElement,
  actionData: unknown,
  searchParams = new URLSearchParams()
) {
  cleanup();

  vi.spyOn(remixReact, "useActionData").mockReturnValue(actionData);
  vi.spyOn(remixReact, "useSearchParams").mockReturnValue([
    searchParams,
    vi.fn(),
  ] as const);

  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

export function renderWithLoaderData(
  ui: ReactElement,
  loaderData: unknown
) {
  cleanup();

  useLoaderDataSpy = vi
    .spyOn(remixReact, "useLoaderData")
    .mockReturnValue(loaderData);

  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

export function expectFormattedDateVisible(date: Date | string) {
  const formatted = formatLendingRequestDateTime(date);

  expect(
    screen.getByText((_, element) => {
      const hasText = (node: Element | null) =>
        node?.textContent?.includes(formatted) ?? false;
      const elementHasText = hasText(element);
      const childrenDontHaveText = Array.from(element?.children ?? []).every(
        (child) => !hasText(child)
      );

      return Boolean(elementHasText && childrenDontHaveText);
    })
  ).toBeInTheDocument();
}
