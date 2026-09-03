import type { useNavigation } from "@remix-run/react";
import { useNavigation as useRemixNavigation } from "@remix-run/react";

export const DISABLED_SUBMIT_BUTTON_CLASS =
  "disabled:cursor-not-allowed disabled:opacity-60";

export function submitButtonClassName(className: string) {
  return `${className} ${DISABLED_SUBMIT_BUTTON_CLASS}`;
}

type Navigation = ReturnType<typeof useNavigation>;

export function isNavigationSubmittingFields(
  navigation: Navigation,
  fields: Record<string, string | undefined>
) {
  if (navigation.state !== "submitting" || !navigation.formData) {
    return false;
  }

  return Object.entries(fields).every(([key, expected]) => {
    if (expected === undefined) {
      return navigation.formData!.has(key);
    }

    return navigation.formData!.get(key) === expected;
  });
}

export function useIsSubmitting() {
  const navigation = useRemixNavigation();
  return navigation.state === "submitting";
}

/**
 * True when a specific form is posting. Pass the hidden fields that identify
 * which button was clicked on pages with several independent POST forms.
 */
export function useIsSubmittingFields(
  fields: Record<string, string | undefined>
) {
  const navigation = useRemixNavigation();
  return isNavigationSubmittingFields(navigation, fields);
}

export function useSubmitButtonLabel(label: string, pendingLabel: string) {
  const isSubmitting = useIsSubmitting();
  return isSubmitting ? pendingLabel : label;
}
