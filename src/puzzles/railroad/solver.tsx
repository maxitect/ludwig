"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { OPEN, OPPOSITE, SIDES, STEP, laidAlong } from "./engine";
import type * as schema from "./schema";

type Piece = schema.Piece;
type Side = schema.Side;
type Mark = Piece | "cross";

const PIECES = Object.keys(OPEN) as Piece[];
const CYCLE: readonly (Mark | undefined)[] = [undefined, ...PIECES, "cross"];
const PIECE_KEYS: Readonly<Record<string, Piece>> = Object.fromEntries(
  PIECES.map((piece, i) => [String(i + 1), piece]),
);
const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const SIDE_NAME: Readonly<Record<Side, string>> = {
  n: "up",
  e: "right",
  s: "down",
  w: "left",
};
const MIDPOINT: Readonly<Record<Side, string>> = {
  n: "5 0",
  e: "10 5",
  s: "5 10",
  w: "0 5",
};

const PIECE_NAME: Readonly<Record<Piece, string>> = {
  ns: "track straight up and down",
  ew: "track straight left and right",
  ne: "track curving up and right",
  nw: "track curving up and left",
  se: "track curving down and right",
  sw: "track curving down and left",
};

/** An ink line from one side's midpoint to the other: straight for opposite sides, a quarter curve for adjacent ones. */
const trackPath = (piece: Piece) => {
  const [a, b] = OPEN[piece];
  const straight = piece === "ns" || piece === "ew";
  return `M${MIDPOINT[a]}${straight ? "L" : "Q5 5 "}${MIDPOINT[b]}`;
};

const pieceIn = (
  givens: ReadonlyMap<number, Piece>,
  marks: ReadonlyMap<number, Mark>,
  index: number,
) => {
  const mark = givens.get(index) ?? marks.get(index);
  return mark === "cross" ? undefined : mark;
};

const nextMark = (mark: Mark | undefined) =>
  CYCLE[(CYCLE.indexOf(mark) + 1) % CYCLE.length];

function Count({
  total,
  laid,
  vertical,
  label,
  active,
}: {
  total: number;
  laid: number;
  vertical?: boolean;
  label: string;
  active: boolean;
}) {
  const state = laid > total ? "over" : laid === total ? "complete" : "short";
  return (
    <div
      role={vertical ? "columnheader" : "rowheader"}
      aria-label={`${label}, count ${total}, ${laid} laid${state === "short" ? "" : `, ${state}`}`}
      data-state={state}
      className={cn(
        "flex items-center justify-center font-display text-sm font-bold tabular-nums sm:text-base",
        vertical ? "min-w-0 flex-1 py-[0.2em]" : "w-8 shrink-0 sm:w-10",
        state === "complete" && "opacity-35",
        state === "over" && "text-ludwig-red underline decoration-2",
        active && "bg-paper-shade",
      )}
    >
      <span aria-hidden>{total}</span>
      {state === "over" && <span aria-hidden>!</span>}
    </div>
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  wrongParts,
}: SolverProps<typeof schema>) {
  const { rows, cols, entry, exit, rowCounts, colCounts, given } = payload;
  const givens = useMemo(
    () => new Map(given.map(({ row, col, piece }) => [row * cols + col, piece])),
    [given, cols],
  );
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(() => {
    const map = new Map<number, Mark>();
    for (const { row, col } of initialState?.crosses ?? []) {
      if (row < rows && col < cols) map.set(row * cols + col, "cross");
    }
    for (const { row, col, piece } of initialState?.pieces ?? []) {
      if (row < rows && col < cols) map.set(row * cols + col, piece);
    }
    for (const index of givens.keys()) map.delete(index);
    return map;
  });
  const marksRef = useRef(marks);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);
  const checkOnEntry = useRef(false);
  const drag = useRef<{
    base: ReadonlyMap<number, Mark>;
    path: number[];
  } | null>(null);

  const totals = (map: ReadonlyMap<number, Mark>) => {
    const rowTotals = new Array<number>(rows).fill(0);
    const colTotals = new Array<number>(cols).fill(0);
    for (let index = 0; index < rows * cols; index++) {
      if (!pieceIn(givens, map, index)) continue;
      rowTotals[Math.floor(index / cols)]++;
      colTotals[index % cols]++;
    }
    return { rowTotals, colTotals };
  };
  const countsMet = (map: ReadonlyMap<number, Mark>) => {
    const { rowTotals, colTotals } = totals(map);
    return (
      rowTotals.every((n, row) => n === rowCounts[row]) &&
      colTotals.every((n, col) => n === colCounts[col])
    );
  };

  const { rowTotals, colTotals } = totals(marks);
  const done = countsMet(marks);
  const wrong = useMemo(
    () => new Set((wrongParts ?? []).map(({ row, col }) => row * cols + col)),
    [wrongParts, cols],
  );

  const answer = useMemo(
    () => ({
      pieces: Array.from({ length: rows * cols }, (_, index) => ({
        index,
        piece: pieceIn(givens, marks, index),
      })).flatMap(({ index, piece }) =>
        piece ? [{ row: Math.floor(index / cols), col: index % cols, piece }] : [],
      ),
    }),
    [marks, givens, rows, cols],
  );

  useEffect(() => {
    registerCheck(() => (done ? answer : null));
  }, [registerCheck, done, answer]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [marks, requestCheck]);

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(cursor.row * cols + cursor.col)?.focus();
  }, [cursor, cols]);

  function commit(next: ReadonlyMap<number, Mark>) {
    marksRef.current = next;
    setMarks(next);
    checkOnEntry.current = countsMet(next);
    onStateChange({
      pieces: [...next]
        .flatMap(([index, mark]) =>
          mark === "cross"
            ? []
            : [{ row: Math.floor(index / cols), col: index % cols, piece: mark }],
        )
        .sort((a, b) => a.row - b.row || a.col - b.col),
      crosses: [...next]
        .flatMap(([index, mark]) =>
          mark === "cross"
            ? [{ row: Math.floor(index / cols), col: index % cols }]
            : [],
        )
        .sort((a, b) => a.row - b.row || a.col - b.col),
    });
  }

  function set(index: number, mark: Mark | undefined) {
    if (solved || givens.has(index)) return;
    const next = new Map(marksRef.current);
    if (mark) next.set(index, mark);
    else next.delete(index);
    commit(next);
  }

  const cellOf = (target: EventTarget | Element | null) => {
    const node = (target as Element | null)?.closest<HTMLElement>("[data-index]");
    return node ? Number(node.dataset.index) : null;
  };
  const adjacent = (a: number, b: number) =>
    Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) +
      Math.abs((a % cols) - (b % cols)) ===
    1;

  /** The side of `start` that already joins laid track, preferring one its own piece opens onto. */
  function joinedSide(base: ReadonlyMap<number, Mark>, start: number, out: Side) {
    const row = Math.floor(start / cols);
    const col = start % cols;
    const joined = SIDES.filter((side) => {
      const [dr, dc] = STEP[side];
      const r = row + dr;
      const c = col + dc;
      if (side === out || r < 0 || r >= rows || c < 0 || c >= cols) return false;
      const piece = pieceIn(givens, base, r * cols + c);
      return !!piece && OPEN[piece].includes(OPPOSITE[side]);
    });
    const own = pieceIn(givens, base, start);
    return joined.find((side) => own && OPEN[own].includes(side)) ?? joined[0];
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (solved || (event.pointerType === "mouse" && event.button !== 0)) return;
    const index = cellOf(event.target);
    if (index === null) return;
    drag.current = { base: marksRef.current, path: [index] };
    focusCursor.current = false;
    setCursor({ row: Math.floor(index / cols), col: index % cols });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const hovered = cellOf(
      document.elementFromPoint(event.clientX, event.clientY),
    );
    const { path } = current;
    if (hovered === null || hovered === path.at(-1)) return;
    const last = path.at(-1)!;
    if (
      Math.floor(hovered / cols) !== Math.floor(last / cols) &&
      hovered % cols !== last % cols
    ) {
      return;
    }
    const step = hovered % cols === last % cols ? cols : 1;
    const direction = hovered > last ? step : -step;
    for (let at = last + direction; ; at += direction) {
      if (path.at(-2) === at) path.pop();
      else if (!path.includes(at) && adjacent(path.at(-1)!, at)) path.push(at);
      if (at === hovered) break;
    }
    const next = new Map(current.base);
    if (path.length > 1) {
      const [start, second] = path;
      const out: Side =
        second === start + 1 ? "e" : second === start - 1 ? "w" : second > start ? "s" : "n";
      const laid = laidAlong(
        { entry, exit },
        path.map((index) => ({
          row: Math.floor(index / cols),
          col: index % cols,
        })),
        joinedSide(current.base, start, out),
      );
      for (const { row, col, piece } of laid) {
        if (!givens.has(row * cols + col)) next.set(row * cols + col, piece);
      }
    }
    commit(next);
  }

  function onPointerUp() {
    const current = drag.current;
    drag.current = null;
    if (!current || current.path.length > 1) return;
    const [index] = current.path;
    set(index, nextMark(current.base.get(index)));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const index = row * cols + col;
    const current = marksRef.current.get(index);
    const arrow = ARROWS[event.key];
    const key = event.key.toLowerCase();
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, col + arrow[1])),
      });
    } else if (PIECE_KEYS[event.key]) {
      event.preventDefault();
      set(index, current === PIECE_KEYS[event.key] ? undefined : PIECE_KEYS[event.key]);
    } else if (key === "x") {
      event.preventDefault();
      set(index, current === "cross" ? undefined : "cross");
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      set(index, nextMark(current));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      set(index, undefined);
    }
  }

  const lights = [
    { ...entry, kind: "entry" as const },
    { ...exit, kind: "exit" as const },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p>
        Lay one track from the entry light (a black disc) to the exit light (a
        red square). It never branches or crosses itself, every piece of track
        is on it, and each row and column holds as many pieces as its number
        says. Drag across cells to lay track, or tap a cell to cycle through
        the pieces, a cross and empty.
      </p>
      <div
        className="paper-sheet mx-auto w-full p-2 select-none"
        style={{ maxWidth: `calc(${cols} * 3rem + 3rem)` }}
      >
        <div
          role="grid"
          aria-label="Railroad grid"
          aria-describedby={helpId}
          aria-disabled={solved}
          data-solved={solved ? "true" : undefined}
          className="flex w-full flex-col touch-none"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <div role="row" className="flex">
            <div aria-hidden className="w-8 shrink-0 sm:w-10" />
            {colCounts.map((total, col) => (
              <Count
                key={col}
                total={total}
                laid={colTotals[col]}
                vertical
                label={`Column ${col + 1}`}
                active={cursor.col === col && !solved}
              />
            ))}
          </div>
          {rowCounts.map((total, row) => (
            <div key={row} role="row" className="flex">
              <Count
                total={total}
                laid={rowTotals[row]}
                label={`Row ${row + 1}`}
                active={cursor.row === row && !solved}
              />
              {Array.from({ length: cols }, (_, col) => {
                const index = row * cols + col;
                const mark = marks.get(index);
                const fixed = givens.get(index);
                const piece = fixed ?? (mark === "cross" ? undefined : mark);
                const light = lights.find(
                  (end) => end.row === row && end.col === col,
                );
                const isCursor = cursor.row === row && cursor.col === col;
                const isWrong = wrong.has(index);
                return (
                  <div
                    key={index}
                    ref={(node) => {
                      if (node) cellRefs.current.set(index, node);
                      else cellRefs.current.delete(index);
                    }}
                    role="gridcell"
                    data-index={index}
                    data-piece={piece ?? (mark === "cross" ? "cross" : "empty")}
                    tabIndex={isCursor ? 0 : -1}
                    aria-disabled={solved || fixed !== undefined}
                    aria-label={[
                      `Row ${row + 1}, column ${col + 1}`,
                      light &&
                        `${light.kind === "entry" ? "entry" : "exit"} light on the ${SIDE_NAME[light.side]} side`,
                      fixed && "given",
                      piece ? PIECE_NAME[piece] : mark === "cross" ? "crossed" : "empty",
                      isWrong && "breaks a rule",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    className={cn(
                      "relative aspect-square min-w-0 flex-1 cursor-pointer bg-paper shadow-[inset_-1px_-1px_0_var(--color-ink),inset_1px_1px_0_var(--color-ink)] outline-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      fixed && "cursor-default",
                    )}
                    onFocus={() => {
                      focusCursor.current = true;
                      setCursor({ row, col });
                    }}
                  >
                    {isWrong && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-10 border-4 border-dashed border-ludwig-red"
                      />
                    )}
                    <svg
                      aria-hidden
                      viewBox="0 0 10 10"
                      className="absolute inset-0 size-full"
                    >
                      {fixed && (
                        <rect
                          x={0.5}
                          y={0.5}
                          width={9}
                          height={9}
                          className="fill-paper-shade"
                        />
                      )}
                      {piece && (
                        <path
                          d={trackPath(piece)}
                          className="fill-none stroke-ink"
                          strokeWidth={1.4}
                          strokeLinecap="butt"
                        />
                      )}
                      {mark === "cross" && !solved && (
                        <path
                          d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
                          className="stroke-ink-soft"
                          strokeWidth={0.9}
                        />
                      )}
                      {light?.kind === "entry" && (
                        <circle
                          cx={5 + STEP[light.side][1] * 3}
                          cy={5 + STEP[light.side][0] * 3}
                          r={1.9}
                          className="fill-ink"
                        />
                      )}
                      {light?.kind === "exit" && (
                        <rect
                          x={5 + STEP[light.side][1] * 3 - 1.8}
                          y={5 + STEP[light.side][0] * 3 - 1.8}
                          width={3.6}
                          height={3.6}
                          className="fill-ludwig-red"
                        />
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p id={helpId} className="sr-only">
        Move with the arrow keys. Press 1 to 6 to lay a piece: 1 straight up
        and down, 2 straight left and right, 3 curving up and right, 4 curving
        up and left, 5 curving down and right, 6 curving down and left. Press X
        to cross a cell as having no track, Space or Enter to cycle the pieces,
        and Backspace to clear it. Given pieces cannot be changed. Tap a cell to cycle it, and
        drag across cells to lay a track. The grid is checked when every count
        is met.
      </p>
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {rowTotals.filter((n, row) => n === rowCounts[row]).length +
          colTotals.filter((n, col) => n === colCounts[col]).length}{" "}
        of {rows + cols} counts met
      </p>
    </div>
  );
}
