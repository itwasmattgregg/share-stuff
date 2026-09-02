export type ErrorPageCopy = {
  title: string;
  message: string;
  detail?: string;
};

const RESPONSE_COPY: Record<number, Omit<ErrorPageCopy, "detail">> = {
  400: {
    title: "That didn't work",
    message:
      "We couldn't complete that action. It may have already been done by someone else.",
  },
  403: {
    title: "You don't have access to this",
    message:
      "This page belongs to another member, or it's inside a community you're not part of.",
  },
  404: {
    title: "We couldn't find that page",
    message:
      "The link may be out of date, or whatever was here has since been removed.",
  },
};

export const UNEXPECTED_ERROR_COPY: ErrorPageCopy = {
  title: "Something went wrong on our end",
  message:
    "We've hit an unexpected error. Trying again often clears it up — if it keeps happening, please report the issue.",
};

export function routeErrorCopy(status: number): ErrorPageCopy {
  const copy = RESPONSE_COPY[status];

  return {
    title: copy?.title ?? UNEXPECTED_ERROR_COPY.title,
    message: copy?.message ?? UNEXPECTED_ERROR_COPY.message,
    detail: `Error ${status}`,
  };
}
