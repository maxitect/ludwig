"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type PanelSectionProps = {
  title: ReactNode;
  /** Sections sharing a `name` are exclusive: opening one closes the others. */
  name?: string;
  defaultOpen?: boolean;
  /** Controlled state: the section follows it and reports user toggles through `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The open section cannot be closed by its own caret (opening another one closes it). */
  keepOpen?: boolean;
  /** The content is the panel's one scroll area, taking the room the other sections leave. */
  scroll?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * A native `<details>` section of the desktop panel (SPEC §4.5). Below `lg` and under `touch` the summary is
 * hidden and the content always shows, so the stacked layout is the solver's own.
 */
export function PanelSection({
  title,
  name,
  defaultOpen,
  open,
  onOpenChange,
  keepOpen,
  scroll,
  className,
  bodyClassName,
  children,
}: PanelSectionProps) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const element = details.current;
    if (element && open !== undefined && element.open !== open) {
      element.open = open;
    }
  }, [open]);
  return (
    <details
      ref={details}
      name={name}
      open={open ?? defaultOpen}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      className={cn(
        "panel-section contents panel:flex panel:min-h-0 panel:flex-col",
        scroll ? "panel:open:flex-1" : "panel:shrink-0",
        className,
      )}
    >
      <summary
        onClick={(event) => {
          if (
            keepOpen &&
            event.currentTarget.parentElement?.hasAttribute("open")
          )
            event.preventDefault();
        }}
        className="hidden min-h-8 shrink-0 cursor-pointer list-none items-center gap-2 border-t-2 border-border font-display text-sm font-bold tracking-[0.08em] uppercase select-none panel:flex [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true" className="panel-caret" />
        {title}
      </summary>
      <div
        data-panel-scroll={scroll ? "" : undefined}
        className={cn(
          "panel:pt-2",
          scroll && "panel:panel-scroll panel:min-h-0 panel:flex-1",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </details>
  );
}
