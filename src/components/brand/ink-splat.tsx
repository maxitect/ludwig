import type { ComponentProps } from "react";

export function InkSplat(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        fill="currentColor"
        d="M104 8c14 10 12 30 26 38 16 9 38-2 52 12 12 13 2 32 6 46 4 16 20 24 12 40-8 15-28 12-38 24-10 12-6 34-22 40-15 6-26-10-42-12-17-2-34 14-48 4-13-10-2-30-10-44-8-14-30-16-34-32-4-16 14-28 18-42 4-14-6-32 6-42 12-9 28 4 42 2 16-2 18-24 32-32z"
      />
      <circle cx="20" cy="28" r="7" fill="currentColor" />
      <circle cx="176" cy="172" r="9" fill="currentColor" />
      <circle cx="190" cy="104" r="4" fill="currentColor" />
      <circle cx="46" cy="186" r="5" fill="currentColor" />
      <circle cx="150" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}
