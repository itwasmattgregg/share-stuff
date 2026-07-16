import { Form, useLocation } from "@remix-run/react";

export default function GlobalSearchBar({
  className = "",
}: {
  className?: string;
}) {
  const location = useLocation();
  const currentSearch =
    location.pathname === "/search"
      ? new URLSearchParams(location.search).get("search") ?? ""
      : "";

  return (
    <Form action="/search" method="get" className={className}>
      <label htmlFor="global-search" className="sr-only">
        Search items
      </label>
      <div className="relative">
        <input
          id="global-search"
          type="search"
          name="search"
          placeholder="Search items..."
          defaultValue={currentSearch}
          className="h-9 w-full max-w-[200px] rounded-lg border border-neutral-300 bg-white py-1.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          aria-label="Search"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </Form>
  );
}
