"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { answerFromMarks } from "./derive";
import { MarkGrid, markKey } from "./mark-grid";
import type * as schema from "./schema";

type Marks = ReadonlyMap<string, "yes" | "no">;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const known = useMemo(
    () =>
      new Set(
        payload.categories.flatMap(({ items }) => items.map(({ id }) => id)),
      ),
    [payload.categories],
  );
  const [marks, setMarks] = useState<Marks>(
    () =>
      new Map(
        initialState?.marks
          .filter(({ itemAId, itemBId }) => known.has(itemAId) && known.has(itemBId))
          .map(({ itemAId, itemBId, mark }) => [markKey(itemAId, itemBId), mark]),
      ),
  );
  const [struck, setStruck] = useState<ReadonlySet<number>>(
    () => new Set(initialState?.struckClues.map(({ cluePosition }) => cluePosition)),
  );
  const [falseClue, setFalseClue] = useState<number | null>(
    initialState?.falseCluePosition ?? null,
  );

  const report = (
    nextMarks: Marks,
    nextStruck: ReadonlySet<number>,
    nextFalse: number | null,
  ) => {
    onStateChange({
      marks: Array.from(nextMarks, ([key, mark]) => {
        const [itemAId, itemBId] = key.split("|");
        return { itemAId, itemBId, mark };
      }),
      struckClues: Array.from(nextStruck, (cluePosition) => ({ cluePosition })).sort(
        (a, b) => a.cluePosition - b.cluePosition,
      ),
      falseCluePosition: nextFalse,
    });
  };

  useEffect(() => {
    registerCheck(() => {
      const links = answerFromMarks(
        payload,
        Array.from(marks, ([key, mark]) => {
          const [itemAId, itemBId] = key.split("|");
          return { itemAId, itemBId, mark };
        }),
      );
      if (!links || (payload.variant && falseClue === null)) return null;
      return { links, falseCluePosition: payload.variant ? falseClue : null };
    });
  }, [registerCheck, payload, marks, falseClue]);

  return (
    <div className="flex flex-col gap-8">
      <p id="logic-grid-help" className="sr-only">
        Each cell pairs two items. Press Space or Enter to cycle a cell through
        blank, no and yes, Backspace to clear it, and the arrow keys to move.
      </p>
      <MarkGrid
        categories={payload.categories}
        marks={marks}
        onCycle={(column, row, next) => {
          const key = markKey(column.id, row.id);
          const nextMarks = new Map(marks);
          if (next) nextMarks.set(key, next);
          else nextMarks.delete(key);
          setMarks(nextMarks);
          report(nextMarks, struck, falseClue);
        }}
      />
      <section aria-labelledby="logic-grid-clues" className="flex flex-col gap-3">
        <h2
          id="logic-grid-clues"
          className="font-display text-2xl font-bold uppercase"
        >
          Clues
        </h2>
        <ol className="flex flex-col gap-2">
          {payload.clues.map(({ position, content }) => {
            const isStruck = struck.has(position);
            return (
              <li key={position} className="flex items-start gap-3">
                <span className="w-6 shrink-0 font-mono tabular-nums">
                  {position + 1}.
                </span>
                <button
                  type="button"
                  aria-pressed={isStruck}
                  onClick={() => {
                    const nextStruck = new Set(struck);
                    if (!nextStruck.delete(position)) nextStruck.add(position);
                    setStruck(nextStruck);
                    report(marks, nextStruck, falseClue);
                  }}
                  className={cn(
                    "cursor-pointer text-left outline-0 focus-visible:outline-2 focus-visible:outline-ring",
                    isStruck && "text-ink-soft line-through",
                  )}
                >
                  <span className="sr-only">Cross out clue {position + 1}: </span>
                  {content}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      {payload.variant && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-2xl font-bold uppercase">
            Which clue is false?
          </legend>
          <p>Exactly one clue above is false. Name it.</p>
          <div className="flex flex-wrap gap-4">
            {payload.clues.map(({ position }) => (
              <label key={position} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="false-clue"
                  checked={falseClue === position}
                  onChange={() => {
                    setFalseClue(position);
                    report(marks, struck, position);
                  }}
                  className="size-5 accent-ink"
                />
                Clue {position + 1}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
