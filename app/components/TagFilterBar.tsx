import { Link, useSearchParams } from "@remix-run/react";

import type { PopularTag } from "~/models/tag.server";

type TagFilterBarProps = {
  tags: PopularTag[];
  selectedSlugs?: string[];
  preserveParams?: string[];
};

export default function TagFilterBar({
  tags,
  selectedSlugs = [],
  preserveParams = ["search"],
}: TagFilterBarProps) {
  const [searchParams] = useSearchParams();

  if (tags.length === 0 && selectedSlugs.length === 0) {
    return null;
  }

  function buildTagUrl(slug: string) {
    const params = new URLSearchParams();

    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) {
        params.set(key, value);
      }
    }

    const isSelected = selectedSlugs.includes(slug);
    const nextSlugs = isSelected
      ? selectedSlugs.filter((selected) => selected !== slug)
      : [...selectedSlugs, slug];

    for (const nextSlug of nextSlugs) {
      params.append("tag", nextSlug);
    }

    const query = params.toString();
    return query ? `?${query}` : ".";
  }

  function buildClearUrl() {
    const params = new URLSearchParams();

    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) {
        params.set(key, value);
      }
    }

    const query = params.toString();
    return query ? `?${query}` : ".";
  }

  const allTags = [
    ...tags,
    ...selectedSlugs
      .filter((slug) => !tags.some((tag) => tag.slug === slug))
      .map((slug) => ({
        id: slug,
        name: slug,
        slug,
        count: 0,
      })),
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-700">Filter by tag</p>
        {selectedSlugs.length > 0 ? (
          <Link
            to={buildClearUrl()}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Clear tags
          </Link>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {allTags.map((tag) => {
          const isActive = selectedSlugs.includes(tag.slug);

          return (
            <Link
              key={tag.slug}
              to={buildTagUrl(tag.slug)}
              className={`inline-flex flex-shrink-0 items-center rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {tag.name}
              {tag.count > 0 ? (
                <span className={`ml-1.5 ${isActive ? "text-primary-100" : "text-neutral-500"}`}>
                  ({tag.count})
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
