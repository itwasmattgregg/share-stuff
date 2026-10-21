import { useId } from "react";

/**
 * Brand mark: an item circulating between neighbours (the loop) around the
 * community it serves (the heart). Drawn in a native 48×48 grid with thin
 * strokes so it stays crisp at favicon and nav sizes. Kept in sync with
 * /public/favicon.svg.
 */
export function ShareStuffMark({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  // useId() emits colons, which browsers reject inside url(#…) references.
  const gradientId = `sharestuff-mark-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill={`url(#${gradientId})`} />

      {/* Heart — sized to leave air around the loop at favicon/nav sizes */}
      <path
        d="M24 30.4 18.2 24.6A3.95 3.95 0 0 1 24 19.15a3.95 3.95 0 0 1 5.8 5.45Z"
        fill="#ffffff"
      />

      {/* Sharing loop — thin stroke so joins stay crisp when scaled down */}
      <g
        stroke="#ffffff"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M10.6 19.7A12.6 12.6 0 0 1 37.4 19.7" />
        <path d="M38.55 14.7 37.4 19.7 33.3 16.55" />
        <path d="M37.4 28.3A12.6 12.6 0 0 1 10.6 28.3" />
        <path d="M9.45 33.3 10.6 28.3 14.7 31.45" />
      </g>
    </svg>
  );
}

export default function ShareStuffLogo({
  className = "",
  markClassName = "h-10 w-10",
  wordmarkClassName = "text-2xl",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ShareStuffMark className={`${markClassName} shrink-0`} />
      {showWordmark ? (
        <span
          className={`bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text font-bold tracking-tight text-transparent ${wordmarkClassName}`}
        >
          ShareStuff
        </span>
      ) : null}
    </div>
  );
}
