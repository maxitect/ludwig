"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { diagramOf, generateDiagram } from "@/puzzles/gears/generate";
import { type Difficulty, difficulties } from "@/puzzles/gears/presets";
import type { Content, Payload } from "@/puzzles/gears/schema";
import { Solver } from "@/puzzles/gears/solver";

function payloadOf({ solution, ...content }: Content): Payload {
  void solution;
  return { ...content, ...diagramOf(content) };
}

const newSeed = () => Math.random().toString(36).slice(2, 8);

export function Playground() {
  const [source, setSource] = useState<Difficulty>("easy");
  const [seed, setSeed] = useState("dev-1");
  const [showSolution, setShowSolution] = useState(false);

  const content = useMemo(() => generateDiagram(seed, source), [source, seed]);
  const payload = useMemo(() => payloadOf(content), [content]);
  const { crank, convergence, killerLabel } = content.solution;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {difficulties.map((option) => (
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
          {seed}
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
