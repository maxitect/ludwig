"use client";

import { useEffect, useRef, useState } from "react";
import { loadFoundRegions, tapScene } from "@/lib/actions/spot-difference";
import { SCENE_HEIGHT, SCENE_WIDTH, regionCentre } from "./engine";
import { renderSceneNode } from "./scene";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const SECTOR = 10;
const COLUMNS = SCENE_WIDTH / SECTOR;
const ROWS = SCENE_HEIGHT / SECTOR;
const GUIDE_EVERY = 5;

type Cursor = { column: number; row: number };

const cursorCentre = ({ column, row }: Cursor) => ({
  x: column * SECTOR + SECTOR / 2,
  y: row * SECTOR + SECTOR / 2,
});

function SceneView({
  label,
  scene,
  found,
  cursor,
  onTap,
}: {
  label: string;
  scene: schema.SceneNode;
  found: ReadonlyMap<number, schema.Region>;
  cursor: Cursor | null;
  onTap(point: { x: number; y: number }): void;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="h-auto w-full cursor-crosshair touch-manipulation border-2 border-border bg-paper shadow-[3px_3px_0_var(--cast)] select-none"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        onTap({
          x: ((event.clientX - box.left) / box.width) * SCENE_WIDTH,
          y: ((event.clientY - box.top) / box.height) * SCENE_HEIGHT,
        });
      }}
    >
      {renderSceneNode(scene, 0)}
      {[...found].map(([index, region]) => {
        const { x, y } = regionCentre(region);
        return (
          <ellipse
            key={index}
            data-testid="found-circle"
            cx={x}
            cy={y}
            rx={region.width / 2 + 3}
            ry={region.height / 2 + 3}
            transform={`rotate(-4 ${x} ${y})`}
            fill="none"
            stroke="var(--color-ludwig-red)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      {cursor && (
        <g stroke="var(--color-grid-blue)" fill="none" pointerEvents="none">
          {Array.from({ length: COLUMNS / GUIDE_EVERY - 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i + 1) * GUIDE_EVERY * SECTOR}
              y1={0}
              x2={(i + 1) * GUIDE_EVERY * SECTOR}
              y2={SCENE_HEIGHT}
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}
          {Array.from({ length: ROWS / GUIDE_EVERY - 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i + 1) * GUIDE_EVERY * SECTOR}
              x2={SCENE_WIDTH}
              y2={(i + 1) * GUIDE_EVERY * SECTOR}
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}
          <rect
            x={cursor.column * SECTOR}
            y={cursor.row * SECTOR}
            width={SECTOR}
            height={SECTOR}
            strokeWidth={2}
          />
        </g>
      )}
    </svg>
  );
}

export function Solver({
  payload: { puzzleId, differenceCount, scenes },
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const [found, setFound] = useState<ReadonlyMap<number, schema.Region>>(
    new Map(),
  );
  const foundRef = useRef(found);
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<Cursor>({
    column: COLUMNS / 2,
    row: ROWS / 2,
  });
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

  async function tap(point: { x: number; y: number }) {
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
      void tap(cursorCentre(cursor));
    } else if (Object.hasOwn(moves, event.key)) {
      event.preventDefault();
      const move = moves[event.key];
      const next = {
        column: Math.min(COLUMNS - 1, Math.max(0, cursor.column + move.column)),
        row: Math.min(ROWS - 1, Math.max(0, cursor.row + move.row)),
      };
      setCursor(next);
      setStatus(`Column ${next.column + 1} of ${COLUMNS}, row ${next.row + 1} of ${ROWS}.`);
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
      <div
        role="group"
        aria-label="The two scenes"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="grid gap-4 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ring sm:grid-cols-2"
      >
        <SceneView
          label="Scene one"
          scene={scenes[0]}
          found={found}
          cursor={activeCursor}
          onTap={tap}
        />
        <SceneView
          label="Scene two"
          scene={scenes[1]}
          found={found}
          cursor={activeCursor}
          onTap={tap}
        />
      </div>
      <p role="status" aria-live="polite" className="min-h-6">
        {status}
      </p>
    </div>
  );
}
