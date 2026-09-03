import { useEffect, useState } from "react";

import type { FlashMessage } from "~/utils/flash";

const TONE_STYLES: Record<FlashMessage["tone"], string> = {
  success: "border-success-200 bg-success-50 text-success-800",
  error: "border-danger-200 bg-danger-50 text-danger-800",
};

export default function FlashBanner({
  flashMessage,
}: {
  flashMessage: FlashMessage | null;
}) {
  const [dismissed, setDismissed] = useState(false);

  // The message is consumed server-side, so a new one only ever arrives with a
  // fresh navigation. Reset so a later message isn't hidden by an earlier
  // dismissal.
  useEffect(() => {
    setDismissed(false);
  }, [flashMessage]);

  if (!flashMessage || dismissed) {
    return null;
  }

  return (
    <div
      role={flashMessage.tone === "error" ? "alert" : "status"}
      className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
        TONE_STYLES[flashMessage.tone]
      }`}
    >
      <p className="text-sm font-medium">{flashMessage.text}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="-m-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
