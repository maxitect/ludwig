"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateDiagram } from "@/puzzles/gears/generate";
import { type Difficulty, difficulties } from "@/puzzles/gears/presets";
import type { Content, Payload } from "@/puzzles/gears/schema";
import { Solver } from "@/puzzles/gears/solver";

const F3_LABEL = "F3";

const gear = (
  label: string,
  teeth: number,
  startSlot: number,
  isDriver = false,
) => ({
  label,
  teeth,
  startSlot,
  initialOffset: 0,
  halfWidthDeg: 45,
  isDriver,
});

/** T034 fixture F3: three gears with several wins, so it is a board check and never valid content. */
const F3: Content = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [gear("A", 8, 0, true), gear("B", 12, 1), gear("C", 16, 2)],
  meshes: [
    { a: "A", b: "B" },
    { a: "B", b: "C" },
  ],
  solution: { crank: 4, convergence: 5, killerLabel: "A", swaps: [] },
};

function payloadOf({ gears, meshes, solution, ...rest }: Content): Payload {
  void solution;
  return {
    ...rest,
    gears: gears.map((g) => ({ ...g, id: g.label })),
    meshes: meshes.map(({ a, b }) => ({ gearAId: a, gearBId: b })),
  };
}

type Source = Difficulty | typeof F3_LABEL;
const sources: Source[] = [...difficulties, F3_LABEL];

const newSeed = () => Math.random().toString(36).slice(2, 8);

export function Playground() {
  const [source, setSource] = useState<Source>("easy");
  const [seed, setSeed] = useState("dev-1");
  const [showSolution, setShowSolution] = useState(false);

  const content = useMemo(
    () => (source === F3_LABEL ? F3 : generateDiagram(seed, source)),
    [source, seed],
  );
  const payload = useMemo(() => payloadOf(content), [content]);
  const { crank, convergence, killerLabel } = content.solution;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {sources.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === source ? "default" : "secondary"}
            aria-pressed={option === source}
            onClick={() => {
              setSource(option);
              setShowSolution(false);
            }}
          >
            {option}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={source === F3_LABEL}
          onClick={() => {
            setSeed(newSeed());
            setShowSolution(false);
          }}
        >
          New seed
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={showSolution}
          onClick={() => setShowSolution((shown) => !shown)}
        >
          Show solution
        </Button>
      </div>
      <p className="text-sm">
        Seed{" "}
        <code className="font-mono" data-testid="seed">
          {source === F3_LABEL ? F3_LABEL : seed}
        </code>
        {showSolution
          ? ` | stored solution: crank ${crank}, convergence ${convergence}, killer ${killerLabel}`
          : null}
      </p>
      <Solver
        key={`${source}-${seed}-${showSolution}`}
        payload={payload}
        initialState={
          showSolution
            ? { crank, convergence, accusedGearId: null, swaps: [] }
            : null
        }
        onStateChange={() => {}}
        registerCheck={() => {}}
      />
    </div>
  );
}
