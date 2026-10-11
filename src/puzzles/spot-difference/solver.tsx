"use client";

import { useEffect, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/utils/cn";
import { loadFoundRegions, tapScene } from "@/lib/actions/spot-difference";
import { regionCentre } from "./regions";
import { SceneArt } from "./scene-art";
import { getScene } from "./scenes";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const COLUMNS = 40;
const GUIDE_EVERY = 5;

type Cursor = { column: number; row: number };
type Point = { x: number; y: number };
type Version = "original" | "altered";
type Sector = { width: number; height: number };

function SceneView({
  label,
  version,
  payload,
  rows,
  sector,
  hiddenOnTouch,
  found,
  cursor,
  onTap,
}: {
  label: string;
  version: Version;
  payload: schema.Payload;
  rows: number;
  sector: Sector;
  hiddenOnTouch: boolean;
  found: ReadonlyMap<number, schema.Region>;
  cursor: Cursor | null;
  onTap(point: Point): void;
}) {
  const { width, height } = payload;
  const circlePadding = width * 0.008;
  return (
    <div
      className={cn(
        "border-2 border-border bg-card text-card-foreground shadow-[3px_3px_0_var(--cast)]",
        hiddenOnTouch && "touch:hidden",
      )}
    >
      <SceneArt
        sceneKey={payload.sceneKey}
        width={width}
        height={height}
        version={version}
        role="img"
        aria-label={label}
        className="cursor-crosshair touch-manipulation select-none"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          onTap({
            x: ((event.clientX - box.left) / box.width) * width,
            y: ((event.clientY - box.top) / box.height) * height,
          });
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden="true"
        >
          {[...found].map(([index, region]) => {
            const { x, y } = regionCentre(region);
            return (
              <ellipse
                key={index}
                data-testid="found-circle"
                cx={x}
                cy={y}
                rx={region.width / 2 + circlePadding}
                ry={region.height / 2 + circlePadding}
                transform={`rotate(-4 ${x} ${y})`}
                fill="none"
                stroke="var(--color-ludwig-red)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {cursor && (
            <g stroke="var(--color-grid-blue)" fill="none">
              {Array.from({ length: COLUMNS / GUIDE_EVERY - 1 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={(i + 1) * GUIDE_EVERY * sector.width}
                  y1={0}
                  x2={(i + 1) * GUIDE_EVERY * sector.width}
                  y2={height}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {Array.from(
                { length: Math.floor((rows - 1) / GUIDE_EVERY) },
                (_, i) => (
                  <line
                    key={`h${i}`}
                    x1={0}
                    y1={(i + 1) * GUIDE_EVERY * sector.height}
                    x2={width}
                    y2={(i + 1) * GUIDE_EVERY * sector.height}
                    strokeWidth={1}
                    strokeDasharray="2 4"
                    vectorEffect="non-scaling-stroke"
                  />
                ),
              )}
              <rect
                x={cursor.column * sector.width}
                y={cursor.row * sector.height}
                width={sector.width}
                height={sector.height}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>
      </SceneArt>
    </div>
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const { puzzleId, sceneKey, width, height, differenceCount } = payload;
  const rows = Math.round((COLUMNS * height) / width);
  const sector: Sector = { width: width / COLUMNS, height: height / rows };
  const scene = getScene(sceneKey);
  const [found, setFound] = useState<ReadonlyMap<number, schema.Region>>(
    new Map(),
  );
  const foundRef = useRef(found);
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<Cursor>({
    column: COLUMNS / 2,
    row: Math.floor(rows / 2),
  });
  const [side, setSide] = useState<0 | 1>(0);
  const [focused, setFocused] = useState(false);
  const completedByTap = useRef(false);
  const complete = found.size === differenceCount;

  useEffect(() => {
    const saved = initialState?.found ?? [];
    if (!saved.length) return;
    let cancelled = false;
    loadFoundRegions(puzzleId, saved)
      .then((result) => {
        if (cancelled || !result.ok) return;
        foundRef.current = new Map([
          ...result.regions.map(({ index, region }) => [index, region] as const),
          ...foundRef.current,
        ]);
        setFound(foundRef.current);
      })
      .catch(() => setStatus("Your saved finds could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, [initialState, puzzleId]);

  useEffect(() => {
    registerCheck(() =>
      complete ? { taps: [...found.values()].map(regionCentre) } : null,
    );
  }, [registerCheck, complete, found]);

  useEffect(() => {
    if (complete && completedByTap.current) {
      completedByTap.current = false;
      requestCheck?.();
    }
  }, [complete, requestCheck]);

  async function tap(point: Point) {
    if (complete) return;
    try {
      const result = await tapScene(puzzleId, point.x, point.y);
      if (!result.ok) return setStatus("That tap could not be checked.");
      if (!result.found) return setStatus("Nothing there.");
      const { index, region } = result.found;
      if (foundRef.current.has(index)) return setStatus("Already circled.");
      const next = new Map(foundRef.current).set(index, region);
      foundRef.current = next;
      setFound(next);
      completedByTap.current = next.size === differenceCount;
      onStateChange({ found: [...next.keys()].sort((a, b) => a - b) });
      setStatus(`Difference found. ${next.size} of ${differenceCount}.`);
    } catch {
      setStatus("That tap could not be checked.");
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? GUIDE_EVERY : 1;
    const moves: Record<string, Cursor> = {
      ArrowLeft: { column: -step, row: 0 },
      ArrowRight: { column: step, row: 0 },
      ArrowUp: { column: 0, row: -step },
      ArrowDown: { column: 0, row: step },
    };
    if (event.key === "Enter") {
      event.preventDefault();
      void tap({
        x: (cursor.column + 0.5) * sector.width,
        y: (cursor.row + 0.5) * sector.height,
      });
    } else if (Object.hasOwn(moves, event.key)) {
      event.preventDefault();
      const move = moves[event.key];
      const next = {
        column: Math.min(COLUMNS - 1, Math.max(0, cursor.column + move.column)),
        row: Math.min(rows - 1, Math.max(0, cursor.row + move.row)),
      };
      setCursor(next);
      setStatus(`Column ${next.column + 1} of ${COLUMNS}, row ${next.row + 1} of ${rows}.`);
    }
  }

  const activeCursor = focused && !complete ? cursor : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        Found{" "}
        <span className="font-mono tabular-nums">
          {found.size} of {differenceCount}
        </span>{" "}
        differences.
      </p>
      <p className="sr-only">
        Focus the pictures, move the highlighted sector with the arrow keys,
        Shift and an arrow key moves five sectors, and press Enter to try the
        sector&rsquo;s centre.
      </p>
      <ToggleGroup
        type="single"
        value={side === 0 ? "left" : "right"}
        onValueChange={(next) => {
          if (next) setSide(next === "left" ? 0 : 1);
        }}
        aria-label="Scene shown"
        className="hidden touch:flex"
      >
        <ToggleGroupItem value="left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <div
        role="group"
        aria-label="The two scenes"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="grid gap-4 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ring sm:grid-cols-2 touch:grid-cols-1"
      >
        <SceneView
          label="Scene one"
          version="original"
          payload={payload}
          rows={rows}
          sector={sector}
          hiddenOnTouch={side !== 0}
          found={found}
          cursor={activeCursor}
          onTap={tap}
        />
        <SceneView
          label="Scene two"
          version="altered"
          payload={payload}
          rows={rows}
          sector={sector}
          hiddenOnTouch={side !== 1}
          found={found}
          cursor={activeCursor}
          onTap={tap}
        />
      </div>
      <p role="status" aria-live="polite" className="min-h-6">
        {status}
      </p>
      {scene && (
        <p className="text-sm text-muted-foreground">
          {scene.credit.artist}, {scene.credit.work}, {scene.credit.year}.{" "}
          <a href={scene.sourceUrl} className="underline">
            Source
          </a>
        </p>
      )}
    </div>
  );
}
