import { useId } from "react";

/**
 * Brand mark: an item circulating between neighbours (the loop) around the
 * community it serves (the heart). Kept in sync with /public/favicon.svg.
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

      <g transform="translate(3.36 3.36) scale(1.72)">
        <path
          d="M12 16.4 8.05 12.45A2.8 2.8 0 0 1 12 8.5A2.8 2.8 0 0 1 15.95 12.45Z"
          fill="#ffffff"
        />
        <g
          stroke="#ffffff"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M4.48 9.26A8 8 0 0 1 19.52 9.26" />
          <path d="M20.17 6.23 19.52 9.26 17.08 7.35" />
          <path d="M19.52 14.74A8 8 0 0 1 4.48 14.74" />
          <path d="M3.83 17.77 4.48 14.74 6.92 16.65" />
        </g>
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
