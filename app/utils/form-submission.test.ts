import { renderHook } from "@testing-library/react";
import { useNavigation } from "@remix-run/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DISABLED_SUBMIT_BUTTON_CLASS,
  isNavigationSubmittingFields,
  submitButtonClassName,
  useIsSubmitting,
  useIsSubmittingFields,
  useSubmitButtonLabel,
} from "./form-submission";

vi.mock("@remix-run/react", () => ({
  useNavigation: vi.fn(),
}));

const mockUseNavigation = vi.mocked(useNavigation);

describe("submitButtonClassName", () => {
  it("appends disabled styles without dropping the base classes", () => {
    expect(submitButtonClassName("rounded bg-primary-500")).toContain(
      "rounded bg-primary-500"
    );
    expect(submitButtonClassName("rounded bg-primary-500")).toContain(
      DISABLED_SUBMIT_BUTTON_CLASS
    );
  });
});

describe("useIsSubmitting", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue({
      state: "idle",
      formData: undefined,
    } as ReturnType<typeof useNavigation>);
  });

  it("is false while idle", () => {
    const { result } = renderHook(() => useIsSubmitting());
    expect(result.current).toBe(false);
  });

  it("is true while a form is posting", () => {
    mockUseNavigation.mockReturnValue({
      state: "submitting",
      formData: new FormData(),
    } as ReturnType<typeof useNavigation>);

    const { result } = renderHook(() => useIsSubmitting());
    expect(result.current).toBe(true);
  });
});

describe("isNavigationSubmittingFields", () => {
  it("matches the hidden fields for a specific button", () => {
    const formData = new FormData();
    formData.set("requestId", "req-1");
    formData.set("status", "APPROVED");

    expect(
      isNavigationSubmittingFields(
        { state: "submitting", formData } as ReturnType<typeof useNavigation>,
        { requestId: "req-1", status: "APPROVED" }
      )
    ).toBe(true);
  });

  it("does not match a different row on the same page", () => {
    const formData = new FormData();
    formData.set("requestId", "req-1");
    formData.set("status", "APPROVED");

    expect(
      isNavigationSubmittingFields(
        { state: "submitting", formData } as ReturnType<typeof useNavigation>,
        { requestId: "req-2", status: "APPROVED" }
      )
    ).toBe(false);
  });
});

describe("useIsSubmittingFields", () => {
  it("delegates to the navigation snapshot", () => {
    const formData = new FormData();
    formData.set("requestId", "req-1");
    formData.set("status", "APPROVED");

    mockUseNavigation.mockReturnValue({
      state: "submitting",
      formData,
    } as ReturnType<typeof useNavigation>);

    const { result } = renderHook(() =>
      useIsSubmittingFields({ requestId: "req-1", status: "APPROVED" })
    );

    expect(result.current).toBe(true);
  });
});

describe("useSubmitButtonLabel", () => {
  it("switches to the pending label while submitting", () => {
    mockUseNavigation.mockReturnValue({
      state: "submitting",
      formData: new FormData(),
    } as ReturnType<typeof useNavigation>);

    const { result } = renderHook(() =>
      useSubmitButtonLabel("Log in", "Signing in…")
    );

    expect(result.current).toBe("Signing in…");
  });
});
