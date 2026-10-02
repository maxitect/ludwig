"use client";

import {
  useEffect,
  useRef,
  useState,
  type InputEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { mulberry32 } from "@/puzzles/_shared/prng";
import { cn } from "@/utils/cn";
import {
  adjacentEntry,
  cellKey,
  DIRECTION_STEP,
  readingOrder,
  stepToPlayable,
  type CellKey,
  type CellPosition,
  type Direction,
} from "./navigation";

export type CellAnnotation = { content: ReactNode; label: string };

export type CellGridProps = {
  rows: number;
  cols: number;
  /** Playable cells; any coordinate missing from the set is a block. */
  cells: ReadonlySet<CellKey>;
  value: (row: number, col: number) => string;
  onChange: (row: number, col: number, value: string) => void;
  /** Receives the typed character, uppercased. */
  accept: (char: string) => boolean;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  highlight?: ReadonlySet<CellKey>;
  annotation?: (row: number, col: number) => CellAnnotation | undefined;
  /** When supplied, Tab and Shift+Tab move between the first cells of these words. */
  words?: ReadonlyArray<ReadonlyArray<CellPosition>>;
  label: string;
};

const ARROWS: Record<string, CellPosition> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
};

/** Deterministic tilt in [-2, 2] degrees, rounded so server and client serialise identically. */
export function cellRotation(index: number) {
  return Number((mulberry32(index + 1)() * 4 - 2).toFixed(2));
}

export function CellGrid({
  rows,
  cols,
  cells,
  value,
  onChange,
  accept,
  direction,
  onDirectionChange,
  highlight,
  annotation,
  words,
  label,
}: CellGridProps) {
  const bounds = { rows, cols, cells };
  const [active, setActive] = useState<CellPosition>(
    () => readingOrder(bounds)[0] ?? { row: 0, col: 0 },
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<CellKey, HTMLDivElement>());

  useEffect(() => {
    const focused = document.activeElement;
    if (
      focused &&
      focused !== inputRef.current &&
      gridRef.current?.contains(focused)
    ) {
      cellRefs.current.get(cellKey(active.row, active.col))?.focus();
    }
  }, [active]);

  const toggleDirection = () =>
    onDirectionChange(direction === "across" ? "down" : "across");

  const enter = (char: string) => {
    const entry = char.toUpperCase();
    if (!accept(entry)) return;
    onChange(active.row, active.col, entry);
    const next = stepToPlayable(bounds, active, DIRECTION_STEP[direction]);
    if (next) setActive(next);
  };

  const erase = () => {
    if (value(active.row, active.col)) {
      onChange(active.row, active.col, "");
      return;
    }
    const { row, col } = DIRECTION_STEP[direction];
    const back = stepToPlayable(bounds, active, { row: -row, col: -col });
    if (!back) return;
    onChange(back.row, back.col, "");
    setActive(back);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const next = stepToPlayable(bounds, active, arrow);
      if (next) setActive(next);
    } else if (event.key === "Tab") {
      const next = adjacentEntry(bounds, words, active, event.shiftKey ? -1 : 1);
      if (!next) return;
      event.preventDefault();
      setActive(next);
    } else if (event.key === " ") {
      event.preventDefault();
      toggleDirection();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      erase();
    } else if (event.key.length === 1) {
      event.preventDefault();
      enter(event.key);
    }
  };

  const onInput = (event: InputEvent<HTMLInputElement>) => {
    const typed = event.currentTarget.value.slice(-1);
    event.currentTarget.value = "";
    if (typed) enter(typed);
  };

  const select = (position: CellPosition) => {
    const engaged = rootRef.current?.contains(document.activeElement);
    if (engaged && position.row === active.row && position.col === active.col) {
      toggleDirection();
    } else {
      setActive(position);
    }
    inputRef.current?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="group relative w-full [container-type:inline-size]"
      style={{ maxWidth: `${cols * 3.5}rem` }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={gridRef}
        role="grid"
        aria-label={label}
        className="flex flex-col border-2 border-ink bg-paper"
      >
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            role="row"
            className="grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }, (_, col) => {
              const key = cellKey(row, col);
              const where = `Row ${row + 1}, column ${col + 1}`;
              if (!cells.has(key)) {
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={`${where}, block`}
                    className="aspect-square border border-ink bg-ink"
                  />
                );
              }
              const entered = value(row, col);
              const note = annotation?.(row, col);
              const isActive = row === active.row && col === active.col;
              return (
                <div
                  key={key}
                  ref={(node) => {
                    if (node) cellRefs.current.set(key, node);
                    else cellRefs.current.delete(key);
                  }}
                  role="gridcell"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={[where, note?.label, entered || "empty"]
                    .filter(Boolean)
                    .join(", ")}
                  data-active={isActive}
                  className={cn(
                    "relative aspect-square cursor-pointer select-none border border-ink bg-paper font-hand text-crayon outline-0",
                    highlight?.has(key) && "bg-paper-deep",
                    "group-focus-within:data-[active=true]:z-10 group-focus-within:data-[active=true]:outline-2 group-focus-within:data-[active=true]:-outline-offset-2 group-focus-within:data-[active=true]:outline-ring",
                  )}
                  style={{ fontSize: `${70 / cols}cqw` }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select({ row, col })}
                  onFocus={() => setActive({ row, col })}
                >
                  {note && (
                    <span
                      aria-hidden
                      className="absolute left-[6%] top-0 font-display text-[0.4em] leading-none text-ink"
                    >
                      {note.content}
                    </span>
                  )}
                  <span
                    className="flex size-full items-center justify-center"
                    style={{
                      transform: `rotate(${cellRotation(row * cols + col)}deg)`,
                    }}
                  >
                    {entered}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        aria-label={`${label} input`}
        tabIndex={-1}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="sr-only text-base"
        onInput={onInput}
      />
    </div>
  );
}
