"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SolverProps } from "../solver-types";
import { GearBoard } from "./board";
import { lcmTeeth, seeingCount } from "./engine";
import type * as schema from "./schema";

const FIGURES = Array.from({ length: 8 }, (_, i) => i + 1);

/** Rough playtest controls. T038 to T040 replace them with the real crank, scrubber and accuse flow. */
export function Solver({ payload, initialState }: SolverProps<typeof schema>) {
  const cranks = lcmTeeth(payload.gears);
  const [crank, setCrank] = useState(initialState?.crank ?? 0);
  const [convergence, setConvergence] = useState(initialState?.convergence ?? 1);
  const turn = (by: number) => setCrank((c) => (c + by + cranks) % cranks);

  return (
    <section className="flex flex-col gap-4">
      <GearBoard diagram={payload} crank={crank} convergence={convergence} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Crank back one tooth"
            onClick={() => turn(-1)}
          >
            -
          </Button>
          <span className="min-w-24 text-center">
            Crank <output data-testid="crank">{crank}</output> of {cranks}
          </span>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Crank forward one tooth"
            onClick={() => turn(1)}
          >
            +
          </Button>
        </div>
        <label className="flex items-center gap-2">
          Convergence
          <select
            value={convergence}
            onChange={(event) => setConvergence(Number(event.target.value))}
            className="h-10 border-2 border-border bg-background px-2 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-ring"
          >
            {FIGURES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <p>
          Gears that see the victim:{" "}
          <output data-testid="seeing-count" className="font-bold">
            {seeingCount(payload, crank, convergence)}
          </output>
        </p>
      </div>
    </section>
  );
}
