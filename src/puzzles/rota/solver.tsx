"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { SolverProps } from "../solver-types";
import { RotaBoard, type Highlight } from "./board";
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

const CLUE_SOURCE: Record<
  schema.Clue["kind"],
  { label: string; broken: string }
> = {
  adjacent_only: { label: "Site rule", broken: "The site rule does not hold" },
  unpowered_square: {
    label: "Site log",
    broken: "The site log does not hold",
  },
  never_in_rank: { label: "Site log", broken: "The site log does not hold" },
  max_swaps: {
    label: "Supervisor",
    broken: "The supervisor's count does not hold",
  },
  not_instigator: { label: "Site log", broken: "The site log does not hold" },
};

/** Drag or tap two tokens to unswap them, then name who insisted on the first swap. */
export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [swaps, setSwaps] = useState(initialState?.swaps ?? []);
  const [instigatorId, setInstigatorId] = useState(
    initialState?.instigatorWorkerId ?? null,
  );
  const [highlight, setHighlight] = useState<Highlight | null>(null);
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
  const victim = tokens.find(({ id }) => id === payload.victimWorkerId);
  const hazardZone = zoneName(final[payload.victimWorkerId]);
  const gambit = swaps[0] ? [swaps[0].workerAId, swaps[0].workerBId] : [];

  function update(next: typeof swaps) {
    const first = next[0];
    const stillNamed =
      instigatorId !== null &&
      first !== undefined &&
      (first.workerAId === instigatorId || first.workerBId === instigatorId);
    const nextInstigator = stillNamed ? instigatorId : null;
    setSwaps(next);
    setInstigatorId(nextInstigator);
    setHighlight(null);
    onStateChange({ swaps: next, instigatorWorkerId: nextInstigator });
  }

  function accuse(id: string) {
    setInstigatorId(id);
    setHighlight(null);
    setAnnouncement(`You accuse ${nameOf(id)} of insisting on the first swap.`);
    onStateChange({ swaps, instigatorWorkerId: id });
  }

  function highlightClue(clue: schema.Clue) {
    const workerIds = [
      clue.speakerWorkerId,
      "workerId" in clue ? clue.workerId : null,
    ].filter((id): id is string => id !== null);
    setHighlight({
      workerIds,
      rank: clue.kind === "never_in_rank" ? clue.rank : null,
      zone:
        clue.kind === "unpowered_square"
          ? `${clue.file.toUpperCase()}${clue.rank}`
          : null,
    });
  }

  useEffect(() => {
    registerCheck(() =>
      restored && instigatorId
        ? { swaps, instigatorWorkerId: instigatorId }
        : null,
    );
  }, [registerCheck, restored, swaps, instigatorId]);

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
    setHighlight(null);
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
      className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(15rem,1fr)]"
    >
      <div className="flex flex-col gap-3">
        <section
          aria-labelledby="rota-incident"
          className="paper-sheet flex flex-col gap-1 p-3"
        >
          <h3
            id="rota-incident"
            className="font-display text-sm font-bold tracking-[0.08em] uppercase"
          >
            Incident sheet
          </h3>
          <p data-testid="rota-brief">
            {payload.brief
              .split("**")
              .map((part, index) =>
                index % 2 ? <strong key={index}>{part}</strong> : part,
              )}
          </p>
        </section>
        <RotaBoard
          tokens={tokens}
          placement={placement}
          steps={steps}
          selectedId={selectedId}
          victim={victim ?? tokens[0]}
          hazardZone={hazardZone}
          highlight={highlight}
          disabled={Boolean(solved)}
          onPick={pick}
          onDropOn={(from, to) => from !== to && !solved && unswap(from, to)}
        />
        <section
          aria-labelledby="rota-pinned"
          className="paper-sheet flex flex-col gap-1 p-3"
        >
          <h3
            id="rota-pinned"
            className="font-display text-sm font-bold tracking-[0.08em] uppercase"
          >
            The rota as pinned up that morning
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-3">
            {tokens.map(({ id, name, label }) => (
              <li key={id}>
                <span className="font-bold">{label}</span> {name},{" "}
                <span data-testid={`now-${name}`}>
                  {zoneName(placement[id])}
                </span>{" "}
                to {zoneName(intended[id])}
              </li>
            ))}
          </ul>
        </section>
        <details className="text-sm" data-testid="rota-how-to-play">
          <summary className="cursor-pointer font-bold">How to play</summary>
          <p className="pt-1">
            The board shows the final rota. Tap or select two tokens (or drag
            one onto another) to unswap them, until every worker is back on
            the intended rota. Press U to undo. Then name who insisted on the
            first swap, and press Check.
          </p>
        </details>
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
            {payload.clues.map((clue) => {
              const isBroken = broken.includes(clue);
              const speaker = clue.speakerWorkerId
                ? nameOf(clue.speakerWorkerId)
                : null;
              const source = CLUE_SOURCE[clue.kind];
              return (
                <li
                  key={clue.position}
                  data-testid={`clue-${clue.position}`}
                  className={
                    isBroken ? "border-l-4 border-primary pl-2" : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => highlightClue(clue)}
                    onFocus={() => highlightClue(clue)}
                    className="block w-full text-left focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {isBroken && (
                      <strong className="block">
                        {speaker
                          ? `${speaker}'s statement does not hold`
                          : source.broken}
                      </strong>
                    )}
                    {speaker ? (
                      <span>
                        <span className="font-bold">{speaker}</span>: &ldquo;
                        {clue.displayText}&rdquo;
                      </span>
                    ) : (
                      <span>
                        <span className="mr-1 font-display text-xs font-bold tracking-[0.08em] uppercase">
                          {source.label}
                        </span>{" "}
                        {clue.displayText}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
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
          <fieldset
            data-testid="rota-accusation"
            className="flex flex-col gap-2"
          >
            <legend className="font-display text-lg font-bold tracking-[0.04em] uppercase">
              Who insisted on the first swap?
            </legend>
            <p className="text-sm">
              Everyone is back on the intended rota. Name the one who insisted,
              then press Check.
            </p>
            {gambit.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-3 border-2 border-border p-3 has-checked:border-primary has-focus-visible:outline-3 has-focus-visible:outline-solid has-focus-visible:outline-ring"
              >
                <input
                  type="radio"
                  name="rota-instigator"
                  value={id}
                  checked={instigatorId === id}
                  onChange={() => accuse(id)}
                  className="size-4 shrink-0 appearance-none border-2 border-border checked:border-primary checked:bg-primary"
                />
                {nameOf(id)}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </section>
  );
}
