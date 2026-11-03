"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { pairsOf, portKey, trace, unmatchedPorts } from "./engine";
import type * as schema from "./schema";

type Mirror = schema.Mirror;
type PortRef = schema.PortRef;
type Side = schema.Side;

const CYCLE: readonly (Mirror | undefined)[] = [
  undefined,
  "slash",
  "backslash",
];
const KEY_MIRROR: Readonly<Record<string, Mirror>> = {
  "/": "slash",
  "\\": "backslash",
};
const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};
const SIDE_NAME: Readonly<Record<Side, string>> = {
  n: "north",
  e: "east",
  s: "south",
  w: "west",
};
const MIRROR_NAME: Readonly<Record<Mirror, string>> = {
  slash: "forward slash mirror",
  backslash: "backslash mirror",
};
/** Which way a camera on each side faces: towards the grid. */
const INWARD: Readonly<Record<Side, readonly [number, number]>> = {
  n: [0, 1],
  e: [-1, 0],
  s: [0, -1],
  w: [1, 0],
};
const ROTATION: Readonly<Record<Side, number>> = { n: 0, e: 90, s: 180, w: 270 };

const nextMirror = (mirror: Mirror | undefined) =>
  CYCLE[(CYCLE.indexOf(mirror) + 1) % CYCLE.length];

const where = ({ side, offset }: PortRef) =>
  `${SIDE_NAME[side]} edge, ${side === "n" || side === "s" ? "column" : "row"} ${offset + 1}`;

const diagonal = (mirror: Mirror) =>
  mirror === "slash" ? "M1.8 8.2L8.2 1.8" : "M1.8 1.8L8.2 8.2";

function Camera({
  port,
  label,
  joined,
  wrong,
  shown,
  pinned,
  describe,
  onFocus,
  onBlur,
  onEnter,
  onLeave,
  onPin,
}: {
  port: PortRef;
  label: string;
  joined: boolean;
  wrong: boolean;
  shown: boolean;
  pinned: boolean;
  describe: string;
  onFocus: () => void;
  onBlur: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onPin: () => void;
}) {
  const [dx, dy] = INWARD[port.side];
  return (
    <button
      type="button"
      data-port={portKey(port)}
      data-joined={joined}
      aria-label={`Camera ${label}, ${where(port)}. ${describe}${wrong ? ". Its beam does not reach its pair" : ""}`}
      aria-pressed={pinned}
      className="relative size-full min-w-0 cursor-pointer outline-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      style={{
        gridColumn: port.side === "w" ? 1 : port.side === "e" ? "-2" : port.offset + 2,
        gridRow: port.side === "n" ? 1 : port.side === "s" ? "-2" : port.offset + 2,
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onPin}
    >
      {wrong && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border-2 border-dashed border-ludwig-red"
        />
      )}
      <svg aria-hidden viewBox="0 0 10 10" className="absolute inset-0 size-full">
        <g transform={`rotate(${ROTATION[port.side]} 5 5)`}>
          <path
            d="M2.2 1.2h5.6v3.8h-5.6zM3.8 5h2.4l1 1.8h-4.4z"
            className={cn(
              "stroke-ink",
              joined ? "fill-ink" : "fill-paper-shade",
              shown && !joined && "fill-paper-deep",
            )}
            strokeWidth={0.5}
          />
        </g>
        <text
          x={5 - dx * 1.9}
          y={5 - dy * 1.9}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={3.6}
          className={cn(
            "font-display font-bold",
            joined ? "fill-paper" : "fill-ink",
          )}
        >
          {label}
        </text>
      </svg>
    </button>
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
  const { rows, cols, fixedMirrors, slots, ports } = payload;
  const fixed = useMemo(
    () =>
      new Map(
        fixedMirrors.map(({ row, col, mirror }) => [row * cols + col, mirror]),
      ),
    [fixedMirrors, cols],
  );
  const slotSet = useMemo(
    () => new Set(slots.map(({ row, col }) => row * cols + col)),
    [slots, cols],
  );
  const [placed, setPlaced] = useState<ReadonlyMap<number, Mirror>>(() => {
    const map = new Map<number, Mirror>();
    for (const { row, col, mirror } of initialState?.mirrors ?? []) {
      if (slotSet.has(row * cols + col)) map.set(row * cols + col, mirror);
    }
    return map;
  });
  const placedRef = useRef(placed);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);
  const checkOnEntry = useRef(false);

  const labels = useMemo(
    () => new Map(ports.map((port) => [portKey(port), port.label])),
    [ports],
  );
  const pairs = useMemo(() => pairsOf(payload), [payload]);
  const list = useMemo(
    () =>
      [...placed].map(([index, mirror]) => ({
        row: Math.floor(index / cols),
        col: index % cols,
        mirror,
      })),
    [placed, cols],
  );
  const lost = useMemo(
    () => new Set(unmatchedPorts(payload, list).map(portKey)),
    [payload, list],
  );
  const complete = placed.size === slots.length;
  const joinedPairs = pairs.filter(({ a }) => !lost.has(portKey(a))).length;
  const flagged = useMemo(
    () => new Set((wrongParts ?? []).map(portKey)),
    [wrongParts],
  );

  useEffect(() => {
    registerCheck(() => (complete ? { mirrors: list } : null));
  }, [registerCheck, complete, list]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [placed, requestCheck]);

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(cursor.row * cols + cursor.col)?.focus();
  }, [cursor, cols]);

  function set(index: number, mirror: Mirror | undefined) {
    if (solved || !slotSet.has(index)) return;
    const next = new Map(placedRef.current);
    if (mirror) next.set(index, mirror);
    else next.delete(index);
    placedRef.current = next;
    setPlaced(next);
    const nextList = [...next].map(([at, kind]) => ({
      row: Math.floor(at / cols),
      col: at % cols,
      mirror: kind,
    }));
    checkOnEntry.current =
      next.size === slots.length &&
      unmatchedPorts(payload, nextList).length === 0;
    onStateChange({
      mirrors: nextList.sort((a, b) => a.row - b.row || a.col - b.col),
    });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const index = row * cols + col;
    const current = placedRef.current.get(index);
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, col + arrow[1])),
      });
    } else if (KEY_MIRROR[event.key]) {
      event.preventDefault();
      set(index, current === KEY_MIRROR[event.key] ? undefined : KEY_MIRROR[event.key]);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      set(index, nextMirror(current));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      set(index, undefined);
    }
  }

  const shown = hovered ?? focused ?? pinned;
  const shownPort = shown
    ? ports.find((port) => portKey(port) === shown)
    : undefined;

  const centre = (port: PortRef) => ({
    x: port.side === "w" ? 0.5 : port.side === "e" ? cols + 1.5 : port.offset + 1.5,
    y: port.side === "n" ? 0.5 : port.side === "s" ? rows + 1.5 : port.offset + 1.5,
  });
  const beamPoints = (from: PortRef) => {
    const { path, exit } = trace(payload, list, from);
    return [
      centre(from),
      ...path.map(({ row, col }) => ({ x: col + 1.5, y: row + 1.5 })),
      centre(exit),
    ]
      .map(({ x, y }) => `${x},${y}`)
      .join(" ");
  };

  function describe(port: PortRef) {
    const { exit } = trace(payload, list, port);
    const reached = labels.get(portKey(exit));
    const place = reached
      ? `at camera ${reached}, ${where(exit)}`
      : `at an unmarked port, ${where(exit)}`;
    return `Its beam currently exits ${place}${lost.has(portKey(port)) ? ", which is not its pair" : ", which is its pair"}`;
  }

  const description = shownPort
    ? `Camera ${shownPort.label}. ${describe(shownPort)}.`
    : "Focus a camera to follow its beam.";

  return (
    <div className="flex flex-col gap-4">
      <p>
        Put a mirror in every dashed square. A beam leaves each lettered
        camera, turns at every mirror and must arrive at the other camera with
        the same letter. Tap a square to cycle a forward slash, a backslash and
        empty.
      </p>
      <div
        className="paper-sheet mx-auto w-full p-2 select-none"
        style={{ maxWidth: `calc(${cols + 2} * 3.25rem + 1rem)` }}
      >
        <div
          className="relative grid w-full"
          style={{
            gridTemplateColumns: `repeat(${cols + 2}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows + 2}, minmax(0, 1fr))`,
            aspectRatio: `${cols + 2} / ${rows + 2}`,
          }}
        >
          <div
            role="grid"
            aria-label="Reflections grid"
            aria-describedby={helpId}
            aria-disabled={solved}
            data-solved={solved ? "true" : undefined}
            className="flex flex-col"
            style={{ gridArea: `2 / 2 / ${rows + 2} / ${cols + 2}` }}
            onKeyDown={onKeyDown}
          >
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} role="row" className="flex min-h-0 flex-1">
                {Array.from({ length: cols }, (_, col) => {
                  const index = row * cols + col;
                  const fixedMirror = fixed.get(index);
                  const isSlot = slotSet.has(index);
                  const mirror = placed.get(index);
                  const isCursor = cursor.row === row && cursor.col === col;
                  return (
                    <div
                      key={index}
                      ref={(node) => {
                        if (node) cellRefs.current.set(index, node);
                        else cellRefs.current.delete(index);
                      }}
                      role="gridcell"
                      data-index={index}
                      data-mirror={fixedMirror ?? mirror ?? (isSlot ? "empty" : "floor")}
                      tabIndex={isCursor ? 0 : -1}
                      aria-disabled={solved || !isSlot}
                      aria-label={[
                        `Row ${row + 1}, column ${col + 1}`,
                        fixedMirror
                          ? `fixed ${MIRROR_NAME[fixedMirror]}`
                          : isSlot
                            ? mirror
                              ? MIRROR_NAME[mirror]
                              : "empty slot"
                            : "open floor",
                      ].join(", ")}
                      className={cn(
                        "relative aspect-square h-auto min-w-0 flex-1 bg-paper shadow-[inset_-1px_-1px_0_var(--color-ink),inset_1px_1px_0_var(--color-ink)] outline-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                        isSlot ? "cursor-pointer" : "cursor-default",
                      )}
                      onFocus={() => {
                        focusCursor.current = true;
                        setCursor({ row, col });
                      }}
                      onClick={() => {
                        setCursor({ row, col });
                        set(index, nextMirror(placedRef.current.get(index)));
                      }}
                    >
                      <svg
                        aria-hidden
                        viewBox="0 0 10 10"
                        className="absolute inset-0 size-full"
                      >
                        {fixedMirror && (
                          <>
                            <rect
                              x={0.5}
                              y={0.5}
                              width={9}
                              height={9}
                              className="fill-paper-shade"
                            />
                            <path
                              d={diagonal(fixedMirror)}
                              className="stroke-ink"
                              strokeWidth={1.6}
                            />
                          </>
                        )}
                        {isSlot && (
                          <rect
                            x={1}
                            y={1}
                            width={8}
                            height={8}
                            className="fill-none stroke-ink-soft"
                            strokeWidth={0.5}
                            strokeDasharray="1.4 1"
                          />
                        )}
                        {mirror && (
                          <path
                            d={diagonal(mirror)}
                            className="stroke-crayon"
                            strokeWidth={1.4}
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {ports.map((port) => {
            const key = portKey(port);
            return (
              <Camera
                key={key}
                port={port}
                label={port.label}
                joined={!lost.has(key)}
                wrong={flagged.has(key)}
                shown={shown === key}
                pinned={pinned === key}
                describe={describe(port)}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused(null)}
                onEnter={() => setHovered(key)}
                onLeave={() => setHovered(null)}
                onPin={() => setPinned(pinned === key ? null : key)}
              />
            );
          })}
          <svg
            aria-hidden
            viewBox={`0 0 ${cols + 2} ${rows + 2}`}
            className="pointer-events-none absolute inset-0 size-full"
          >
            {pairs
              .filter(
                ({ a, b }) =>
                  !lost.has(portKey(a)) &&
                  portKey(a) !== shown &&
                  portKey(b) !== shown,
              )
              .map(({ label, a }) => (
                <polyline
                  key={label}
                  points={beamPoints(a)}
                  className="fill-none stroke-ink"
                  strokeWidth={0.07}
                  strokeLinejoin="round"
                />
              ))}
            {shownPort && (
              <polyline
                key={`${shown}-${list.map(({ row, col, mirror }) => `${row}${col}${mirror}`).join()}`}
                data-beam={shown}
                points={beamPoints(shownPort)}
                pathLength={1}
                className="fill-none stroke-ludwig-red motion-safe:animate-[beam-draw_0.5s_linear]"
                strokeWidth={0.09}
                strokeLinejoin="round"
                strokeDasharray={1}
              />
            )}
          </svg>
        </div>
      </div>
      <p id={helpId} className="sr-only">
        Move with the arrow keys. Press the forward slash key or the backslash
        key to put that mirror in a square, Space or Enter to cycle forward
        slash, backslash and empty, and Backspace to clear it. Tab to a camera
        to hear where its beam currently exits. The grid is checked when every
        pair is joined.
      </p>
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {joinedPairs} of {pairs.length} pairs joined
      </p>
      <p aria-live="polite" data-testid="beam-note" className="min-h-[3lh] text-sm">
        {description}
      </p>
    </div>
  );
}
