"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type InputEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
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

/** A sign drawn on the edge a cell shares with its right or lower neighbour, such as a futoshiki inequality. */
export type CellEdges = { right?: CellAnnotation; down?: CellAnnotation };

export type CellGridProps = {
  rows: number;
  cols: number;
  /** Playable cells; any coordinate missing from the set is a block. */
  cells: ReadonlySet<CellKey>;
  value: (row: number, col: number) => string;
  onChange: (row: number, col: number, value: string) => void;
  /** Receives the typed character, uppercased. */
  accept: (char: string) => boolean;
  /** Typing advances along it and Space toggles it. Omit it for grids where typing stays in the cell. */
  direction?: Direction;
  onDirectionChange?: (direction: Direction) => void;
  /** Cells that show their value but cannot be typed into or erased, such as givens. */
  readOnly?: ReadonlySet<CellKey>;
  cellClassName?: (row: number, col: number) => string | undefined;
  /** Decoration drawn behind the value of a cell, such as pencil marks. */
  marks?: (row: number, col: number) => ReactNode;
  inputMode?: "text" | "numeric";
  highlight?: ReadonlySet<CellKey>;
  annotation?: (row: number, col: number) => CellAnnotation | undefined;
  /** Signs between this cell and its right and lower neighbours. Their labels join the cell's accessible name. */
  edges?: (row: number, col: number) => CellEdges | undefined;
  /** Largest width of a cell in rem, which caps the grid. Defaults to 3.5. */
  cellRem?: number;
  /** When supplied, Tab and Shift+Tab move between the first cells of these words; an empty list lets Tab leave the grid. */
  words?: ReadonlyArray<ReadonlyArray<CellPosition>>;
  label: string;
  /** Controls the active cell; the grid tracks it itself when omitted. */
  active?: CellPosition;
  onActiveChange?: (position: CellPosition) => void;
  ref?: Ref<CellGridHandle>;
};

export type CellGridHandle = { focus: () => void };

const ARROWS: Partial<Record<string, CellPosition>> = {
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
  readOnly,
  cellClassName,
  marks,
  inputMode,
  highlight,
  annotation,
  edges,
  cellRem = 3.5,
  words,
  label,
  active: controlledActive,
  onActiveChange,
  ref,
}: CellGridProps) {
  const bounds = { rows, cols, cells };
  const [ownActive, setOwnActive] = useState<CellPosition>(
    () => readingOrder(bounds)[0] ?? { row: 0, col: 0 },
  );
  const active = controlledActive ?? ownActive;
  const setActive = (position: CellPosition) => {
    setOwnActive(position);
    onActiveChange?.(position);
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<CellKey, HTMLDivElement>());

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  useEffect(() => {
    const focused = document.activeElement;
    if (
      focused &&
      focused !== inputRef.current &&
      gridRef.current?.contains(focused)
    ) {
      cellRefs.current.get(cellKey(active.row, active.col))?.focus();
    }
  }, [active.row, active.col]);

  const toggleDirection = () => {
    if (direction) onDirectionChange?.(direction === "across" ? "down" : "across");
  };

  const locked = () => readOnly?.has(cellKey(active.row, active.col));

  const enter = (char: string) => {
    const entry = char.toUpperCase();
    if (locked() || !accept(entry)) return;
    onChange(active.row, active.col, entry);
    if (!direction) return;
    const next = stepToPlayable(bounds, active, DIRECTION_STEP[direction]);
    if (next) setActive(next);
  };

  const erase = () => {
    if (locked()) return;
    if (!direction || value(active.row, active.col)) {
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
      if (!next) {
        cellRefs.current.get(cellKey(active.row, active.col))?.focus();
        return;
      }
      event.preventDefault();
      setActive(next);
    } else if (event.key === " ") {
      event.preventDefault();
      toggleDirection();
    } else if (event.key === "Backspace" || event.key === "Delete") {
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
      style={{ maxWidth: `${cols * cellRem}rem` }}
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
              const sides = edges?.(row, col);
              const isActive = row === active.row && col === active.col;
              const isLocked = readOnly?.has(key);
              return (
                <div
                  key={key}
                  ref={(node) => {
                    if (node) cellRefs.current.set(key, node);
                    else cellRefs.current.delete(key);
                  }}
                  role="gridcell"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={[
                    where,
                    note?.label,
                    sides?.right?.label,
                    sides?.down?.label,
                    isLocked && "given",
                    entered || "empty",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  data-active={isActive}
                  className={cn(
                    "relative aspect-square cursor-pointer select-none border border-ink bg-paper font-hand text-crayon outline-0",
                    isLocked && "font-display font-bold text-ink",
                    highlight?.has(key) && "bg-paper-deep",
                    cellClassName?.(row, col),
                    "group-focus-within:data-[active=true]:z-10 group-focus-within:data-[active=true]:outline-2 group-focus-within:data-[active=true]:-outline-offset-2 group-focus-within:data-[active=true]:outline-ring",
                  )}
                  style={{ fontSize: `${70 / cols}cqw` }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select({ row, col })}
                  onFocus={() => setActive({ row, col })}
                >
                  {marks?.(row, col)}
                  {note && (
                    <span
                      aria-hidden
                      className="absolute left-[6%] top-0 font-display text-[0.4em] leading-none text-ink"
                    >
                      {note.content}
                    </span>
                  )}
                  {sides?.right && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-0 top-1/2 z-20 flex size-[0.7em] -translate-y-1/2 translate-x-1/2 items-center justify-center bg-paper font-display text-[0.5em] font-bold leading-none text-ink"
                    >
                      {sides.right.content}
                    </span>
                  )}
                  {sides?.down && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute bottom-0 left-1/2 z-20 flex size-[0.7em] -translate-x-1/2 translate-y-1/2 items-center justify-center bg-paper font-display text-[0.5em] font-bold leading-none text-ink"
                    >
                      {sides.down.content}
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
        inputMode={inputMode}
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
