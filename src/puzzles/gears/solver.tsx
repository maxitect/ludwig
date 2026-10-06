"use client";

import { useMotionValue } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
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
import { applySwaps, lcmTeeth, seeingCount } from "./engine";
import { Scrubber } from "./scrubber";
import type * as schema from "./schema";
import {
  StateTable,
  StateTableToggle,
  useStateTableToggle,
} from "./state-table";
import { SwapPanel } from "./swap-panel";
import { pickGear, undoSwapOf } from "./swaps";

/** The crank, the dance scrubber and the accuse flow are live. */
export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
}: SolverProps<typeof schema>) {
  const cranks = lcmTeeth(payload.gears);
  const driver = payload.gears.find((gear) => gear.isDriver);
  if (!driver) throw new Error("gear puzzle has no driver");
  const [state, setState] = useState({
    crank: initialState?.crank ?? 0,
    convergence: initialState?.convergence ?? 1,
    accusedGearId: initialState?.accusedGearId ?? null,
    swaps: initialState?.swaps ?? [],
  });
  const { crank, convergence, accusedGearId, swaps } = state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const diagram = useMemo(() => applySwaps(payload, swaps), [payload, swaps]);
  const adjustable = payload.maxAdjustments > 0;
  const [picked, setPicked] = useState(accusedGearId);
  const [accusations, setAccusations] = useState(0);
  const table = useStateTableToggle();
  const accuseHint = useId();
  const position = useMotionValue(markerOf(convergence));
  const [atConvergence, setAtConvergence] = useState(true);

  function update(next: Partial<typeof state>) {
    const merged = { ...state, ...next };
    setState(merged);
    onStateChange(merged);
  }

  const labelOf = (id: string) =>
    payload.gears.find((gear) => gear.id === id)!.label;

  function pick(gearId: string) {
    if (solved) return;
    const result = pickGear(
      swaps,
      selectedId,
      gearId,
      payload.maxAdjustments,
      labelOf,
    );
    setSelectedId(result.selectedId);
    setNotice(result.notice);
    if (result.swaps !== swaps) update({ swaps: result.swaps });
  }

  function undo(gearId: string) {
    if (solved) return;
    setSelectedId(null);
    setNotice(null);
    update({ swaps: undoSwapOf(swaps, gearId) });
  }

  useEffect(() => {
    registerCheck(() =>
      accusedGearId
        ? {
            crank,
            convergence,
            accusedGearId,
            swaps,
          }
        : null,
    );
  }, [registerCheck, crank, convergence, accusedGearId, swaps]);

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
  const seeing = seeingCount(diagram, crank, convergence);
  const offConvergence = !solved && !atConvergence;

  return (
    <section className="flex flex-col gap-4">
      {adjustable && (
        <blockquote className="border-l-4 border-border pl-4">
          &ldquo;100% solvable if we adjust a couple of the starting
          positions.&rdquo;
          <p className="mt-1 text-sm">
            This diagram as printed has no solution. Swap up to{" "}
            {payload.maxAdjustments} {payload.maxAdjustments === 1 ? "pair" : "pairs"} of starting
            slots to fix it, then find the crank, the convergence and the
            killer.
          </p>
        </blockquote>
      )}
      <GearBoard
        diagram={diagram}
        crank={crank}
        convergence={convergence}
        position={position}
        crankProps={crankProps}
        adjustments={
          adjustable ? { swaps, selectedId, onPick: pick } : undefined
        }
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
      <StateTableToggle shown={table.shown} onToggle={table.toggle} />
      {table.shown && (
        <StateTable diagram={diagram} crank={crank} convergence={convergence} />
      )}
      {adjustable && (
        <SwapPanel
          gears={payload.gears}
          swaps={swaps}
          max={payload.maxAdjustments}
          selectedId={selectedId}
          notice={notice}
          onPick={pick}
          onUndo={undo}
        />
      )}
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
              disabled={solved || !atConvergence}
              aria-describedby={offConvergence ? accuseHint : undefined}
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
                    className="size-4 shrink-0 appearance-none border-2 border-border checked:border-primary checked:bg-primary"
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
        {offConvergence && (
          <p id={accuseHint} className="text-sm">
            Move the scrubber onto a convergence marker to accuse.
          </p>
        )}
      </div>
    </section>
  );
}
