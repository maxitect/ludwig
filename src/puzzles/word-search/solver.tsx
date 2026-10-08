"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HighlightPathGrid } from "../_shared/highlight-path/highlight-path-grid";
import type { SolverProps } from "../solver-types";
import { derivePlacements, matchSelection } from "./derive";
import type * as schema from "./schema";

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
}: SolverProps<typeof schema>) {
  const { rows, cols, cells, words } = payload;
  const letters = useMemo(
    () => new Map(cells.map(({ row, col, letter }) => [`${row},${col}`, letter])),
    [cells],
  );
  const derived = useMemo(() => derivePlacements(payload, words), [payload, words]);
  const [found, setFound] = useState<string[]>(() =>
    (initialState?.found ?? []).filter((word) => words.includes(word)),
  );
  const [status, setStatus] = useState("");
  const finishedBySelection = useRef(false);

  const strokes = useMemo(
    () =>
      found.flatMap((word) => {
        const [placement] =
          derived.find((entry) => entry.word === word)?.placements ?? [];
        return placement ? [placement] : [];
      }),
    [found, derived],
  );
  const complete = found.length === words.length;

  useEffect(() => {
    registerCheck(() => (complete ? { selections: strokes } : null));
  }, [registerCheck, complete, strokes]);

  useEffect(() => {
    if (complete && finishedBySelection.current) {
      finishedBySelection.current = false;
      requestCheck?.();
    }
  }, [complete, requestCheck]);

  function select(
    start: { row: number; col: number },
    end: { row: number; col: number },
  ) {
    const word = matchSelection(derived, start, end);
    if (!word) return setStatus("That is not one of the words.");
    if (found.includes(word)) return setStatus(`You already found ${word}.`);
    const next = [...found, word];
    setFound(next);
    setStatus(`Found ${word}. ${words.length - next.length} to go.`);
    finishedBySelection.current = next.length === words.length;
    onStateChange({ found: next });
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <HighlightPathGrid
          rows={rows}
          cols={cols}
          letter={(row, col) => letters.get(`${row},${col}`) ?? ""}
          label="Word search grid"
          found={strokes}
          onSelect={select}
          disabled={solved || complete}
        />
        <p role="status" className="min-h-6 font-display text-sm uppercase">
          {status}
        </p>
      </div>
      <section aria-labelledby="word-search-words" className="md:w-56">
        <h2
          id="word-search-words"
          className="border-b-2 border-border pb-1 font-display text-lg font-bold tracking-[0.04em] uppercase"
        >
          Find {words.length} words
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 md:flex-col">
          {words.map((word) => {
            const isFound = found.includes(word);
            return (
              <li
                key={word}
                className={
                  isFound
                    ? "font-display text-lg text-ink-soft line-through decoration-ludwig-red decoration-2"
                    : "font-display text-lg"
                }
              >
                {word}
                {isFound && <span className="sr-only"> (found)</span>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
