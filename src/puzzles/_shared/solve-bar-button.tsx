"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

/** A previous or next button for a bar above the on-screen pad. It keeps focus where it was, so the grid or input stays engaged. */
export function SolveBarButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="flex size-12 shrink-0 items-center justify-center border-2 border-border bg-card text-card-foreground select-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring active:border-ludwig-red active:text-ludwig-red disabled:opacity-50"
      onPointerDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
