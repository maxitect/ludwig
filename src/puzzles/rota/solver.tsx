"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { SolverProps } from "../solver-types";
import { RotaBoard } from "./board";
import { brokenClues } from "./check";
import { placementFor, samePlacement } from "./engine";
import type * as schema from "./schema";
import {
  popUnswap,
  pushUnswap,
  stackSteps,
  tokenLabels,
  unswapped,
  zoneName,
} from "./stack";

/** Drag or tap two tokens to unswap them; the pencil stack and undo sit beside the board. */
export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [swaps, setSwaps] = useState(initialState?.swaps ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const intended = useMemo(
    () => placementFor(payload.workers, "intended"),
    [payload.workers],
  );
  const final = useMemo(
    () => placementFor(payload.workers, "final"),
    [payload.workers],
  );
  const placement = useMemo(() => unswapped(final, swaps), [final, swaps]);
  const steps = useMemo(() => stackSteps(final, swaps), [final, swaps]);
  const labels = useMemo(
    () => tokenLabels(payload.workers.map(({ name }) => name)),
    [payload.workers],
  );
  const tokens = payload.workers.map(({ id, name }) => ({
    id,
    name,
    label: labels[name],
  }));
  const nameOf = (id: string) =>
    payload.workers.find((worker) => worker.id === id)?.name ?? id;
  const restored = samePlacement(placement, intended);
  const broken = restored ? brokenClues(payload, swaps) : [];

  function update(next: typeof swaps) {
    setSwaps(next);
    onStateChange({ swaps: next });
  }

  useEffect(() => {
    registerCheck(() => (restored ? { swaps } : null));
  }, [registerCheck, restored, swaps]);

  function unswap(a: string, b: string) {
    const swap = { workerAId: a, workerBId: b };
    const next = pushUnswap(swaps, swap);
    setSelectedId(null);
    setAnnouncement(
      `Unswapped ${nameOf(a)} and ${nameOf(b)}. Step ${next.length} is on the stack.`,
    );
    update(next);
  }

  function pick(id: string) {
    if (solved) return;
    if (selectedId === null) {
      setSelectedId(id);
      setAnnouncement(`${nameOf(id)} selected. Choose a second worker.`);
    } else if (selectedId === id) {
      setSelectedId(null);
      setAnnouncement("Selection cleared.");
    } else {
      unswap(selectedId, id);
    }
  }

  function undo() {
    if (solved || !swaps.length) return;
    const [last] = swaps;
    const next = popUnswap(swaps);
    setSelectedId(null);
    setAnnouncement(
      `Undid step ${swaps.length}: ${nameOf(last.workerAId)} and ${nameOf(last.workerBId)} are swapped back. ${next.length} on the stack.`,
    );
    update(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && selectedId) {
      setSelectedId(null);
      setAnnouncement("Selection cleared.");
    } else if (
      (event.key.toLowerCase() === "u" && !event.metaKey && !event.ctrlKey) ||
      (event.key.toLowerCase() === "z" && (event.metaKey || event.ctrlKey))
    ) {
      event.preventDefault();
      undo();
    }
  }

  return (
    <section
      onKeyDown={onKeyDown}
      className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,32rem)_1fr]"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          The board shows the final rota. Tap or select two tokens (or drag one
          onto another) to unswap them, until every worker is back on the
          intended rota. Press U to undo.
        </p>
        <RotaBoard
          tokens={tokens}
          placement={placement}
          steps={steps}
          selectedId={selectedId}
          disabled={Boolean(solved)}
          onPick={pick}
          onDropOn={(from, to) => from !== to && !solved && unswap(from, to)}
        />
        <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-3">
          {tokens.map(({ id, name, label }) => (
            <li key={id}>
              <span className="font-bold">{label}</span> {name},{" "}
              <span data-testid={`now-${name}`}>{zoneName(placement[id])}</span>{" "}
              to {zoneName(intended[id])}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-6">
        <section aria-labelledby="rota-clues" className="flex flex-col gap-2">
          <h3
            id="rota-clues"
            className="font-display text-lg font-bold tracking-[0.04em] uppercase"
          >
            Clues
          </h3>
          <ol className="flex list-decimal flex-col gap-1 pl-6">
            {payload.clues.map((clue) => (
              <li
                key={clue.position}
                data-testid={`clue-${clue.position}`}
                className={
                  broken.includes(clue)
                    ? "border-l-4 border-primary pl-2 font-bold"
                    : undefined
                }
              >
                {broken.includes(clue) && <span>Broken: </span>}
                {clue.displayText}
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="rota-stack" className="flex flex-col gap-2">
          <h3
            id="rota-stack"
            className="font-display text-lg font-bold tracking-[0.04em] uppercase"
          >
            Unswaps so far
          </h3>
          {steps.length === 0 ? (
            <p className="text-sm">Nothing unswapped yet.</p>
          ) : (
            <ol
              data-testid="rota-stack"
              className="flex flex-col gap-1 border-l-4 border-primary pl-4"
            >
              {steps.map(({ step, swap, from, to }) => (
                <li key={step}>
                  Step {step}: {nameOf(swap.workerAId)} ({zoneName(from)}) and{" "}
                  {nameOf(swap.workerBId)} ({zoneName(to)})
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={undo}
              disabled={solved || !swaps.length}
              aria-keyshortcuts="U"
            >
              Undo
            </Button>
          </div>
          <p
            aria-live="polite"
            data-testid="rota-status"
            className="min-h-6 text-sm"
          >
            {announcement}
          </p>
        </section>
        {restored && !solved && (
          <p className="text-sm">
            Everyone is back on the intended rota. Press Check.
          </p>
        )}
      </div>
    </section>
  );
}
