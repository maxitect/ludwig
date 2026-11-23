"use client";

import type { Ref } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/cn";
import type { Direction } from "../_shared/cell-grid";
import { usePanelLayout } from "../_shared/use-panel-layout";
import { DIRECTIONS, type Entry } from "./derive";

export type ClueTabsProps = {
  entries: ReadonlyArray<Entry>;
  direction: Direction;
  activeEntry: Entry | undefined;
  onDirection: (next: Direction) => void;
  onSelect: (entry: Entry) => void;
  listRef?: Ref<HTMLOListElement>;
  className?: string;
  listClassName?: string;
  /** In the desktop panel, show both lists at once and scroll each inside the panel. */
  split?: boolean;
};

export function ClueTabs({
  entries,
  direction,
  activeEntry,
  onDirection,
  onSelect,
  listRef,
  className,
  listClassName,
  split,
}: ClueTabsProps) {
  const both = usePanelLayout() && split;
  return (
    <Tabs
      className={cn(className, both && "min-h-0 flex-1")}
      value={direction}
      onValueChange={(value) => {
        const next = DIRECTIONS.find((along) => along === value);
        if (next) onDirection(next);
      }}
    >
      <TabsList aria-label="Clue direction" className={cn(both && "hidden")}>
        {DIRECTIONS.map((along) => (
          <TabsTrigger key={along} value={along}>
            {along}
          </TabsTrigger>
        ))}
      </TabsList>
      {DIRECTIONS.map((along) => (
        <TabsContent
          key={along}
          value={along}
          {...(both ? { forceMount: true as const, hidden: false } : {})}
          className={cn(both && "flex min-h-0 flex-1 flex-col gap-1")}
        >
          {both && (
            <h3 className="font-display text-sm uppercase">{along}</h3>
          )}
          <ol
            ref={along === direction ? listRef : undefined}
            className={cn(
              "relative flex flex-col overflow-y-auto",
              both ? "min-h-0 flex-1" : listClassName,
            )}
          >
            {entries
              .filter((entry) => entry.direction === along)
              .map((entry) => {
                const current = entry === activeEntry;
                return (
                  <li key={entry.number}>
                    <button
                      type="button"
                      aria-current={current}
                      onClick={() => onSelect(entry)}
                      className={cn(
                        "flex w-full gap-2 touch:min-h-11 border-l-4 border-transparent px-2 py-1 text-left outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-ring",
                        current && "border-foreground bg-muted",
                      )}
                    >
                      <span className="w-6 shrink-0 font-display font-bold">
                        {entry.number}
                      </span>
                      <span>
                        {entry.clueText}{" "}
                        <span className="whitespace-nowrap">
                          {entry.enumeration}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ol>
        </TabsContent>
      ))}
    </Tabs>
  );
}
