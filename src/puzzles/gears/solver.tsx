"use client";

import { useMotionValue } from "motion/react";
import { useEffect, useId, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { SolverProps } from "../solver-types";
import { GearBoard } from "./board";
import { useCrank } from "./crank";
import { markerOf } from "./dance";
import { lcmTeeth, seeingCount } from "./engine";
import { Scrubber } from "./scrubber";
import type * as schema from "./schema";

/** The crank, the dance scrubber and the accuse flow are live. */
export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const cranks = lcmTeeth(payload.gears);
  const driver = payload.gears.find((gear) => gear.isDriver);
  if (!driver) throw new Error("gear puzzle has no driver");
  const [state, setState] = useState({
    crank: initialState?.crank ?? 0,
    convergence: initialState?.convergence ?? 1,
    accusedGearId: initialState?.accusedGearId ?? null,
  });
  const { crank, convergence, accusedGearId } = state;
  const [picked, setPicked] = useState(accusedGearId);
  const [accusations, setAccusations] = useState(0);
  const accuseHint = useId();
  const position = useMotionValue(markerOf(convergence));
  const [atConvergence, setAtConvergence] = useState(true);

  function update(next: Partial<typeof state>) {
    const merged = { ...state, ...next };
    setState(merged);
    onStateChange({
      swaps: initialState?.swaps ?? [],
      ...merged,
    });
  }

  useEffect(() => {
    registerCheck(() =>
      accusedGearId
        ? {
            crank,
            convergence,
            accusedGearId,
            swaps: initialState?.swaps ?? [],
          }
        : null,
    );
  }, [registerCheck, crank, convergence, accusedGearId, initialState]);

  useEffect(() => {
    if (accusations > 0) requestCheck?.();
  }, [accusations, requestCheck]);

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
      <div className="flex flex-col gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="self-start"
              disabled={!atConvergence}
              aria-describedby={atConvergence ? undefined : accuseHint}
            >
              Accuse
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accuse a gear</AlertDialogTitle>
              <AlertDialogDescription>
                Crank {crank}, convergence {convergence}. Which gear is the
                killer?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Killer gear</legend>
              {payload.gears.map((gear) => (
                <label
                  key={gear.id}
                  className="flex cursor-pointer items-center gap-3 border-2 border-border p-3 has-checked:border-primary has-focus-visible:outline-3 has-focus-visible:outline-solid has-focus-visible:outline-ring"
                >
                  <input
                    type="radio"
                    name="killer-gear"
                    value={gear.id}
                    checked={picked === gear.id}
                    onChange={() => setPicked(gear.id)}
                    className="size-4 accent-primary"
                  />
                  Gear {gear.label}, {gear.teeth} teeth
                </label>
              ))}
            </fieldset>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={picked === null}
                onClick={() => {
                  update({ accusedGearId: picked });
                  setAccusations((n) => n + 1);
                }}
              >
                Accuse
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!atConvergence && (
          <p id={accuseHint} className="text-sm">
            Move the scrubber onto a convergence marker to accuse.
          </p>
        )}
      </div>
    </section>
  );
}
