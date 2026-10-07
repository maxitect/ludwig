"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";
import type { AttemptState, Payload } from "./schema";

type Mark = AttemptState["marks"][number]["mark"];
type Item = Payload["categories"][number]["items"][number];
type Placed = { item: Item; category: number };

export type MarkGridProps = {
  categories: Payload["categories"];
  marks: ReadonlyMap<string, Mark>;
  onCycle: (columnItem: Item, rowItem: Item, next: Mark | undefined) => void;
};

export const markKey = (itemAId: string, itemBId: string) =>
  `${itemAId}|${itemBId}`;

const NEXT: Record<Mark | "blank", Mark | undefined> = {
  blank: "no",
  no: "yes",
  yes: undefined,
};

const SYMBOL: Record<Mark, string> = { no: "✕", yes: "●" };

const CELL = "size-10 shrink-0";

/**
 * The staircase of every pair of categories: columns are the items of every category but the last, rows the items of every
 * category but the first, and a cell exists only where the column's category comes before the row's.
 * Space or Enter cycles a cell through blank, no and yes; the arrow keys move between cells.
 */
export function MarkGrid({ categories, marks, onCycle }: MarkGridProps) {
  const columns: Placed[] = categories
    .slice(0, -1)
    .flatMap(({ position, items }) =>
      items.map((item) => ({ item, category: position })),
    );
  const rows: Placed[] = categories
    .slice(1)
    .flatMap(({ position, items }) =>
      items.map((item) => ({ item, category: position })),
    );
  const exists = (row: number, col: number) =>
    row >= 0 &&
    col >= 0 &&
    row < rows.length &&
    col < columns.length &&
    columns[col].category < rows[row].category;
  const [active, setActive] = useState({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const focused = document.activeElement;
    if (focused && gridRef.current?.contains(focused)) {
      cellRefs.current.get(`${active.row},${active.col}`)?.focus();
    }
  }, [active]);

  const stateOf = (row: number, col: number) =>
    marks.get(markKey(columns[col].item.id, rows[row].item.id)) ?? "blank";

  const cycle = (row: number, col: number) =>
    onCycle(
      columns[col].item,
      rows[row].item,
      NEXT[stateOf(row, col)],
    );

  const move = (rowStep: number, colStep: number) => {
    let row = active.row + rowStep;
    let col = active.col + colStep;
    while (
      row >= 0 &&
      col >= 0 &&
      row < rows.length &&
      col < columns.length &&
      !exists(row, col)
    ) {
      row += rowStep;
      col += colStep;
    }
    if (exists(row, col)) setActive({ row, col });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const steps: Partial<Record<string, [number, number]>> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      move(...step);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      cycle(active.row, active.col);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onCycle(columns[active.col].item, rows[active.row].item, undefined);
    }
  };

  const rowStart = (row: number) =>
    row === 0 || rows[row].category !== rows[row - 1].category;

  return (
    <div className="max-w-full overflow-x-auto border-2 border-ink bg-paper text-ink">
      <div
        ref={gridRef}
        role="grid"
        aria-label="Logic grid"
        aria-describedby="logic-grid-help"
        className="flex w-max flex-col"
        onKeyDown={onKeyDown}
      >
        <div role="row" className="flex">
          <div role="columnheader" aria-label="Items" className="w-32 shrink-0" />
          {columns.map(({ item, category }, col) => (
            <div
              key={item.id}
              role="columnheader"
              className={cn(
                CELL,
                "flex h-32 items-end justify-start border-l border-ink pb-1",
                (col === 0 || columns[col - 1].category !== category) &&
                  "border-l-2",
              )}
            >
              <span className="font-display text-sm font-bold uppercase [writing-mode:vertical-rl] rotate-180">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        {rows.map(({ item }, row) => (
          <div
            key={item.id}
            role="row"
            className={cn("flex", rowStart(row) && "border-t-2 border-ink")}
          >
            <div
              role="rowheader"
              className="flex h-10 w-32 shrink-0 items-center px-2 font-display text-sm font-bold uppercase"
            >
              {item.label}
            </div>
            {columns.map((column, col) => {
              if (!exists(row, col)) {
                return (
                  <div
                    key={column.item.id}
                    aria-hidden
                    className={cn(CELL, "bg-paper-shade")}
                  />
                );
              }
              const state = stateOf(row, col);
              const isActive = active.row === row && active.col === col;
              return (
                <div
                  key={column.item.id}
                  ref={(node) => {
                    const id = `${row},${col}`;
                    if (node) cellRefs.current.set(id, node);
                    else cellRefs.current.delete(id);
                  }}
                  role="gridcell"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={`${column.item.label} × ${item.label}: ${state}`}
                  data-active={isActive}
                  className={cn(
                    CELL,
                    "flex cursor-pointer select-none items-center justify-center border-b border-l border-ink font-display text-xl font-bold outline-0 data-[active=true]:outline-2 data-[active=true]:-outline-offset-2 data-[active=true]:outline-ring",
                    (col === 0 || columns[col - 1].category !== column.category) &&
                      "border-l-2",
                    state === "yes" && "text-ludwig-red",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onFocus={() => setActive({ row, col })}
                  onClick={() => {
                    setActive({ row, col });
                    cycle(row, col);
                  }}
                >
                  <span aria-hidden>{state === "blank" ? "" : SYMBOL[state]}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
