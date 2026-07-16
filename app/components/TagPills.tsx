import { Link } from "@remix-run/react";

export type TagLike = {
  name: string;
  slug: string;
};

type TagPillsProps = {
  tags: TagLike[];
  linkable?: boolean;
  linkBase?: string;
  getTagHref?: (slug: string) => string;
  size?: "sm" | "md";
  className?: string;
};

export default function TagPills({
  tags,
  linkable = false,
  linkBase = "/tags",
  getTagHref,
  size = "sm",
  className = "",
}: TagPillsProps) {
  if (tags.length === 0) {
    return null;
  }

  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-sm"
      : "px-2 py-1 text-xs";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => {
        const pill = (
          <span
            key={tag.slug}
            className={`inline-flex rounded-full bg-primary-100 text-primary-800 ${sizeClasses}`}
          >
            {tag.name}
          </span>
        );

        if (!linkable) {
          return pill;
        }

        const href = getTagHref ? getTagHref(tag.slug) : `${linkBase}/${tag.slug}`;

        return (
          <Link
            key={tag.slug}
            to={href}
            className={`inline-flex rounded-full bg-primary-100 text-primary-800 transition-colors hover:bg-primary-200 ${sizeClasses}`}
          >
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
