"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { revealCameras } from "@/lib/actions/cctv-maze";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { canStep, deriveSeen } from "./derive";
import type * as schema from "./schema";

type Cell = schema.AttemptState["path"][number];

const MOVES: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const key = (row: number, col: number) => `${row},${col}`;
const same = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;

/** The saved path up to its first break, so a stale save can never put the player through a wall. */
function restorePath(payload: schema.Payload, saved: Cell[]) {
  const start = { row: payload.startRow, col: payload.startCol };
  const path = [start];
  if (!saved.length || !same(saved[0], start)) return path;
  for (const next of saved.slice(1)) {
    if (!canStep(payload, path[path.length - 1], next)) break;
    path.push(next);
  }
  return path;
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const { puzzleId, rows, cols, walls, cameras, exitRow, exitCol } = payload;
  const [path, setPath] = useState(() =>
    restorePath(payload, initialState?.path ?? []),
  );
  const [camerasShown, setCamerasShown] = useState(false);
  const [message, setMessage] = useState("");
  const helpId = useId();
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const focusHead = useRef(false);

  const head = path[path.length - 1];
  const atExit = head.row === exitRow && head.col === exitCol;
  const onPath = useMemo(
    () => new Set(path.map(({ row, col }) => key(row, col))),
    [path],
  );
  const seen = useMemo(
    () => (camerasShown ? deriveSeen(payload) : []),
    [camerasShown, payload],
  );
  const seenCells = useMemo(
    () => new Set(seen.map(({ row, col }) => key(row, col))),
    [seen],
  );
  const cameraCells = useMemo(
    () => new Set(cameras.map(({ row, col }) => key(row, col))),
    [cameras],
  );
  const revealRecorded = useRef(false);

  useEffect(() => {
    registerCheck(() => (atExit && path.length > 1 ? { path } : null));
  }, [registerCheck, atExit, path]);

  useEffect(() => {
    if (focusHead.current) cellRefs.current.get(key(head.row, head.col))?.focus();
  }, [head]);

  function commit(next: Cell[]) {
    setPath(next);
    onStateChange({ path: next });
  }

  function stepTo(row: number, col: number) {
    if (solved) return;
    const target = { row, col };
    const previous = path[path.length - 2];
    if (previous && same(previous, target)) {
      setMessage("Stepped back.");
      return commit(path.slice(0, -1));
    }
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return setMessage("That is the edge of the maze.");
    }
    if (!canStep(payload, head, target)) {
      return setMessage(
        Math.abs(row - head.row) + Math.abs(col - head.col) === 1
          ? "A wall blocks the way."
          : "Move to a neighbouring cell.",
      );
    }
    setMessage("");
    commit([...path, target]);
  }

  async function reveal() {
    setCamerasShown((shown) => !shown);
    if (camerasShown || revealRecorded.current) return;
    revealRecorded.current = true;
    try {
      const result = await revealCameras(puzzleId);
      if (!result.ok) throw new Error(result.error);
    } catch {
      revealRecorded.current = false;
      setMessage("The hint could not be recorded.");
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      focusHead.current = true;
      stepTo(head.row + move[0], head.col + move[1]);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      focusHead.current = true;
      if (path.length > 1) stepTo(path[path.length - 2].row, path[path.length - 2].col);
    }
  }

  const line = path
    .map(({ row, col }) => `${col + 0.5},${row + 0.5}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      <p>
        Walk from the start to the exit without entering a camera&apos;s view.
        The cameras are hidden: revealing them counts as a hint.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          aria-pressed={camerasShown}
          onClick={reveal}
        >
          {camerasShown ? "Hide cameras" : "Reveal cameras"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={solved || path.length < 2}
          onClick={() => {
            setMessage("Back to the start.");
            commit(path.slice(0, 1));
          }}
        >
          Restart path
        </Button>
      </div>
      <div
        className="relative w-full"
        style={{ maxWidth: `${cols * 3}rem` }}
      >
        <div
          role="grid"
          aria-label="CCTV maze street plan"
          aria-describedby={helpId}
          aria-disabled={solved}
          className="relative flex flex-col border-2 border-border bg-paper-shade shadow-[3px_3px_0_var(--cast)] select-none"
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: rows }, (_, row) => (
            <div
              key={row}
              role="row"
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {Array.from({ length: cols }, (_, col) => {
                const cell = key(row, col);
                const isHead = same(head, { row, col });
                const labels = [
                  row === payload.startRow && col === payload.startCol
                    ? "start"
                    : null,
                  row === exitRow && col === exitCol ? "exit" : null,
                  isHead ? "you are here" : onPath.has(cell) ? "on your path" : null,
                  camerasShown && cameraCells.has(cell)
                    ? "camera"
                    : null,
                  seenCells.has(cell)
                    ? "in a camera's view"
                    : null,
                ].filter(Boolean);
                return (
                  <div
                    key={cell}
                    ref={(node) => {
                      if (node) cellRefs.current.set(cell, node);
                      else cellRefs.current.delete(cell);
                    }}
                    role="gridcell"
                    tabIndex={isHead ? 0 : -1}
                    aria-label={`Row ${row + 1}, column ${col + 1}${labels.length ? `, ${labels.join(", ")}` : ""}`}
                    aria-selected={onPath.has(cell)}
                    data-head={isHead}
                    className={cn(
                      "aspect-square cursor-pointer outline-0",
                      onPath.has(cell) ? "bg-paper-deep" : "hover:bg-paper-deep",
                      "focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    )}
                    onClick={() => {
                      focusHead.current = false;
                      stepTo(row, col);
                    }}
                    onFocus={() => {
                      focusHead.current = true;
                    }}
                  />
                );
              })}
            </div>
          ))}
          <svg
            aria-hidden
            viewBox={`0 0 ${cols} ${rows}`}
            className="pointer-events-none absolute inset-0 size-full"
          >
            {seen.map(({ row, col }) => (
              <g key={key(row, col)}>
                <rect
                  x={col}
                  y={row}
                  width={1}
                  height={1}
                  className="fill-ludwig-red/20"
                />
                <path
                  d={`M ${col + 0.1} ${row + 0.9} L ${col + 0.9} ${row + 0.1} M ${col + 0.1} ${row + 0.5} L ${col + 0.5} ${row + 0.1} M ${col + 0.5} ${row + 0.9} L ${col + 0.9} ${row + 0.5}`}
                  fill="none"
                  strokeWidth={0.05}
                  className="stroke-ludwig-red"
                />
              </g>
            ))}
            {camerasShown &&
              cameras.map(({ row, col }) => (
                <rect
                  key={key(row, col)}
                  x={col + 0.3}
                  y={row + 0.3}
                  width={0.4}
                  height={0.4}
                  className="fill-ludwig-red"
                />
              ))}
            {walls.map(({ row, col, side }) => (
              <line
                key={`${row},${col},${side}`}
                x1={col}
                y1={row}
                x2={side === "north" ? col + 1 : col}
                y2={side === "north" ? row : row + 1}
                strokeWidth={0.1}
                strokeLinecap="square"
                className="stroke-ink"
              />
            ))}
            {path.length > 1 && (
              <polyline
                points={line}
                fill="none"
                strokeWidth={0.12}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-crayon"
              />
            )}
            <circle
              cx={payload.startCol + 0.5}
              cy={payload.startRow + 0.5}
              r={0.2}
              className="fill-ink"
            />
            <circle
              cx={exitCol + 0.5}
              cy={exitRow + 0.5}
              r={0.32}
              fill="none"
              strokeWidth={0.07}
              className="stroke-ink"
            />
            <circle
              cx={exitCol + 0.5}
              cy={exitRow + 0.5}
              r={0.14}
              className="fill-ink"
            />
            <rect
              x={head.col + 0.25}
              y={head.row + 0.25}
              width={0.5}
              height={0.5}
              strokeWidth={0.07}
              className="fill-paper stroke-crayon"
            />
          </svg>
        </div>
        <p id={helpId} className="sr-only">
          Move with the arrow keys, or select a neighbouring cell. Step back
          with Backspace or by moving onto the cell you came from.
        </p>
      </div>
      <p role="status" className="font-display text-sm uppercase">
        {atExit
          ? "At the exit. Check your path."
          : `${path.length - 1} ${path.length === 2 ? "step" : "steps"} taken`}
        {message ? ` · ${message}` : ""}
      </p>
    </div>
  );
}
