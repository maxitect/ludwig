"use client";

import { useMotionValue } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SolverProps } from "../solver-types";
import { GearBoard } from "./board";
import { useCrank } from "./crank";
import { markerOf } from "./dance";
import { lcmTeeth, seeingCount } from "./engine";
import { Scrubber } from "./scrubber";
import type * as schema from "./schema";

/** The crank and the dance scrubber are live. T040 adds the accuse flow. */
export function Solver({
  payload,
  initialState,
  onStateChange,
}: SolverProps<typeof schema>) {
  const cranks = lcmTeeth(payload.gears);
  const driver = payload.gears.find((gear) => gear.isDriver);
  if (!driver) throw new Error("gear puzzle has no driver");
  const [state, setState] = useState({
    crank: initialState?.crank ?? 0,
    convergence: initialState?.convergence ?? 1,
  });
  const { crank, convergence } = state;
  const position = useMotionValue(markerOf(convergence));
  const [atConvergence, setAtConvergence] = useState(true);

  function update(next: Partial<typeof state>) {
    const merged = { ...state, ...next };
    setState(merged);
    onStateChange({
      accusedGearId: initialState?.accusedGearId ?? null,
      swaps: initialState?.swaps ?? [],
      ...merged,
    });
  }

  function settle(next: number | null) {
    setAtConvergence(next !== null);
    if (next !== null && next !== convergence) update({ convergence: next });
  }

  const setCrank = (next: number) => update({ crank: next });
  const turn = (by: number) => setCrank((crank + by + cranks) % cranks);
  const crankProps = useCrank({
    driver,
    slotCount: payload.slotCount,
    cranks,
    crank,
    onChange: setCrank,
  });
  const seeing = seeingCount(payload, crank, convergence);

  return (
    <section className="flex flex-col gap-4">
      <GearBoard
        diagram={payload}
        crank={crank}
        convergence={convergence}
        position={position}
        crankProps={crankProps}
      />
      <Scrubber position={position} onSettle={settle} />
      <p
        aria-live="polite"
        data-testid="convergence-status"
        className="min-h-6"
      >
        {atConvergence ? (
          <>
            Convergence {convergence}:{" "}
            <output data-testid="seeing-count" className="font-bold">
              {seeing}
            </output>{" "}
            {seeing === 1 ? "dancer sees" : "dancers see"} the victim
          </>
        ) : null}
      </p>
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
    </section>
  );
}
