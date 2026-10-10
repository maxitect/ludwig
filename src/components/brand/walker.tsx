import type { ComponentProps } from "react";

const silhouette = {
  viewBox: "0 0 24 48",
  "aria-hidden": true,
  focusable: false,
  className: "absolute inset-0 size-full",
} as const;

/** Each leg is its own element, because a transform animated inside an SVG forces a layout every frame. */
export function Walker({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`relative h-12 w-48 [container-type:inline-size] overflow-hidden border-2 border-border ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-8 [&>span]:border-r [&>span]:border-border"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="walker-figure absolute bottom-0 left-0 h-full w-6 text-foreground">
        <svg {...silhouette}>
          <circle cx="12" cy="6" r="5" fill="currentColor" />
          <path d="M7 13h10l2 18H5z" fill="currentColor" />
        </svg>
        <svg {...silhouette} className={`${silhouette.className} walker-leg walker-leg-a`}>
          <path d="M8 30h5l-1 16H7z" fill="currentColor" />
        </svg>
        <svg {...silhouette} className={`${silhouette.className} walker-leg walker-leg-b`}>
          <path d="M11 30h5l1 16h-5z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
