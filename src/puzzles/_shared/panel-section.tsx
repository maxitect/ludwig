"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { PANEL_QUERY } from "./use-panel-layout";
import { useWholeRows } from "./use-whole-rows";

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
  /** For a scroll area: a selector for its rows, so the area is cut at a whole row. */
  rows?: string;
  /** Below `lg` and under `touch` keep a plain disclosure (summary shown, closed by default) instead of always-visible content. */
  disclosure?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * A native `<details>` section of the desktop panel (SPEC §4.5). Below `lg` and under `touch` the summary is
 * hidden and the content always shows: `::details-content` renders it, and the sections are opened after
 * hydration so the accessibility tree holds it too (nothing moves, the content was already drawn).
 */
export function PanelSection({
  title,
  name,
  defaultOpen,
  open,
  onOpenChange,
  keepOpen,
  scroll,
  rows,
  disclosure,
  className,
  bodyClassName,
  children,
}: PanelSectionProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const wanted = useRef(open ?? defaultOpen ?? false);
  useWholeRows(scroller, details, scroll ? rows : undefined);
  useEffect(() => {
    const element = details.current;
    if (open === undefined) return;
    wanted.current = open;
    const inPanel =
      typeof window.matchMedia === "function" &&
      window.matchMedia(PANEL_QUERY).matches;
    if (element && (inPanel || disclosure) && element.open !== open)
      element.open = open;
  }, [open, disclosure]);
  useEffect(() => {
    const element = details.current;
    if (!element || disclosure || typeof window.matchMedia !== "function")
      return;
    const panel = window.matchMedia(PANEL_QUERY);
    const sync = () => {
      if (panel.matches) {
        if (name) element.setAttribute("name", name);
        element.open = wanted.current;
        return;
      }
      element.removeAttribute("name");
      element.open = true;
    };
    sync();
    panel.addEventListener("change", sync);
    return () => panel.removeEventListener("change", sync);
  }, [disclosure, name]);
  return (
    <details
      ref={details}
      name={name}
      open={open ?? defaultOpen}
      onToggle={(event) => {
        const inPanel =
          typeof window.matchMedia !== "function" ||
          window.matchMedia(PANEL_QUERY).matches;
        if (inPanel || disclosure) onOpenChange?.(event.currentTarget.open);
      }}
      className={cn(
        "panel-section panel:flex panel:min-h-0 panel:flex-col",
        disclosure ? "block" : "contents",
        !disclosure && "panel-section-flat",
        scroll ? "panel:shrink-0 panel:open:shrink panel:open:flex-1" : "panel:shrink-0",
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
        className={cn(
          "cursor-pointer panel:flex panel:min-h-8 panel:shrink-0 panel:list-none panel:items-center panel:gap-2 panel:border-t-2 panel:border-border panel:font-display panel:text-sm panel:font-bold panel:tracking-[0.08em] panel:uppercase panel:select-none panel:[&::-webkit-details-marker]:hidden",
          disclosure ? "font-bold" : "hidden",
        )}
      >
        <span aria-hidden="true" className="panel-caret hidden panel:inline-block" />
        {title}
      </summary>
      <div
        ref={scroller}
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
