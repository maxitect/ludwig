"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/utils/cn";
import { cellRotation } from "../cell-grid/cell-grid";
import { selectionPath, type CellPosition } from "./path";

export type FoundStroke = { start: CellPosition; end: CellPosition };

export type HighlightPathGridProps = {
  rows: number;
  cols: number;
  letter: (row: number, col: number) => string;
  label: string;
  /** Selections already accepted, drawn as red pencil strokes. */
  found: readonly FoundStroke[];
  /** Called with the two ends of a finished selection, by drag or by keyboard. */
  onSelect: (start: CellPosition, end: CellPosition) => void;
  disabled?: boolean;
  /** Largest width of a cell in rem, which caps the grid. Defaults to 3. */
  cellRem?: number;
};

const ARROWS: Partial<Record<string, CellPosition>> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
};

const same = (a: CellPosition, b: CellPosition) =>
  a.row === b.row && a.col === b.col;

/** A pencil stroke through the cell centres, bowed slightly by a jitter seeded from its ends. */
function strokePath({ start, end }: FoundStroke) {
  const x1 = start.col + 0.5;
  const y1 = start.row + 0.5;
  const x2 = end.col + 0.5;
  const y2 = end.row + 0.5;
  const bow = (cellRotation(start.row * 31 + start.col * 7 + end.row) / 2) * 0.12;
  const cx = (x1 + x2) / 2 - (y2 - y1) * bow;
  const cy = (y1 + y2) / 2 + (x2 - x1) * bow;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/**
 * A letter grid whose cells are selected as a straight line, from one end to the other. Drag a
 * finger or pointer across it, or use the keyboard: the arrows move, Enter marks the start, the
 * arrows extend and Enter confirms. Escape drops a marked start.
 */
export function HighlightPathGrid({
  rows,
  cols,
  letter,
  label,
  found,
  onSelect,
  disabled,
  cellRem = 3,
}: HighlightPathGridProps) {
  const [cursor, setCursor] = useState<CellPosition>({ row: 0, col: 0 });
  const [anchor, setAnchor] = useState<CellPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const helpId = useId();
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const focusCursor = useRef(false);

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(`${cursor.row},${cursor.col}`)?.focus();
  }, [cursor]);

  const pending = anchor ? selectionPath(anchor, cursor, { rows, cols }) : [];
  const pendingKeys = new Set(pending.map(({ row, col }) => `${row},${col}`));

  const cellAt = (event: PointerEvent): CellPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * cols);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * rows);
    return {
      row: Math.min(rows - 1, Math.max(0, row)),
      col: Math.min(cols - 1, Math.max(0, col)),
    };
  };

  const finish = (start: CellPosition, end: CellPosition) => {
    setAnchor(null);
    setDragging(false);
    if (!same(start, end)) onSelect(start, end);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (disabled || event.button > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const cell = cellAt(event);
    focusCursor.current = false;
    setCursor(cell);
    setAnchor(cell);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) setCursor(cellAt(event));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging || !anchor) return;
    const [end] = selectionPath(anchor, cellAt(event), { rows, cols }).slice(-1);
    setCursor(end);
    finish(anchor, end);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled || event.ctrlKey || event.metaKey || event.altKey) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, cursor.row + arrow.row)),
        col: Math.min(cols - 1, Math.max(0, cursor.col + arrow.col)),
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!anchor) {
        setAnchor(cursor);
        setAnnouncement(
          `Start marked at row ${cursor.row + 1}, column ${cursor.col + 1}. Move with the arrow keys, then press Enter to finish.`,
        );
      } else {
        finish(anchor, cursor);
      }
    } else if (event.key === "Escape" && anchor) {
      event.preventDefault();
      setAnchor(null);
      setAnnouncement("Selection cancelled.");
    }
  };

  return (
    <div
      className="relative w-full [container-type:inline-size]"
      style={{ maxWidth: `${cols * cellRem}rem` }}
    >
      <div
        role="grid"
        aria-label={label}
        aria-describedby={helpId}
        aria-disabled={disabled}
        className="relative flex touch-none flex-col border-2 border-ink bg-paper select-none"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          setAnchor(null);
          setDragging(false);
        }}
      >
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            role="row"
            className="grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }, (_, col) => {
              const key = `${row},${col}`;
              const isCursor = same(cursor, { row, col });
              const isStart = anchor !== null && same(anchor, { row, col });
              return (
                <div
                  key={key}
                  ref={(node) => {
                    if (node) cellRefs.current.set(key, node);
                    else cellRefs.current.delete(key);
                  }}
                  role="gridcell"
                  tabIndex={isCursor ? 0 : -1}
                  aria-label={`Row ${row + 1}, column ${col + 1}, ${letter(row, col)}${isStart ? ", selection start" : ""}`}
                  aria-selected={pendingKeys.has(key)}
                  data-cursor={isCursor}
                  className={cn(
                    "flex aspect-square items-center justify-center border border-paper-deep font-display font-bold text-ink outline-0",
                    pendingKeys.has(key) && "bg-paper-deep",
                    isStart && "underline decoration-2 underline-offset-4",
                    "focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  )}
                  style={{ fontSize: `${60 / cols}cqw` }}
                  onFocus={() => {
                    focusCursor.current = true;
                    setCursor({ row, col });
                  }}
                >
                  {letter(row, col)}
                </div>
              );
            })}
          </div>
        ))}
        <svg
          aria-hidden
          viewBox={`0 0 ${cols} ${rows}`}
          className="pointer-events-none absolute inset-0 size-full"
        >
          {found.map((stroke) => (
            <path
              key={`${stroke.start.row},${stroke.start.col},${stroke.end.row},${stroke.end.col}`}
              d={strokePath(stroke)}
              data-testid="found-stroke"
              fill="none"
              strokeLinecap="round"
              strokeWidth={0.2}
              className="stroke-ludwig-red/70"
            />
          ))}
        </svg>
      </div>
      <p id={helpId} className="sr-only">
        Select a word as a straight line of letters. Drag across it, or move
        with the arrow keys, press Enter to mark the start, move to the last
        letter and press Enter again.
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
