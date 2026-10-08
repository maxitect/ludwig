"use client";

import { useEffect, useState } from "react";
import { LetterTiles } from "../_shared/letter-tiles/letter-tile";
import { RungInput } from "../_shared/letter-tiles/rung-input";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";
import type { AttemptState, RungProblem } from "./schema";

const REASON_TEXT: Record<RungProblem["reason"], string> = {
  "not-a-word": "Not a word we know",
  "not-one-step": "Change exactly one letter at each step",
  repeated: "Already used on this ladder",
};

function restoreRungs(
  rungCount: number,
  length: number,
  saved: AttemptState["rungs"],
) {
  const rungs = Array.from({ length: rungCount }, () => "");
  for (const { position, word } of saved) {
    if (position < rungCount) rungs[position] = word.slice(0, length);
  }
  return rungs;
}

export function Solver({
  payload: { startWord, endWord, rungCount },
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  rungProblems,
}: SolverProps<typeof schema>) {
  const length = startWord.length;
  const [rungs, setRungs] = useState(() =>
    restoreRungs(rungCount, length, initialState?.rungs ?? []),
  );
  const [problems, setProblems] = useState<RungProblem[]>([]);
  const [seenProblems, setSeenProblems] = useState(rungProblems);

  if (rungProblems !== seenProblems) {
    setSeenProblems(rungProblems);
    setProblems(rungProblems ?? []);
  }

  useEffect(() => {
    registerCheck(() =>
      rungs.every((word) => word.length === length)
        ? { ladder: [startWord, ...rungs, endWord] }
        : null,
    );
  }, [registerCheck, rungs, length, startWord, endWord]);

  function update(position: number, word: string) {
    const next = rungs.map((current, i) => (i === position ? word : current));
    setRungs(next);
    setProblems([]);
    onStateChange({
      rungs: next.flatMap((value, i) =>
        value ? [{ position: i, word: value }] : [],
      ),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only">
        Fill each rung with a word of {length} letters that changes exactly one
        letter from the rung above. Type to fill a tile, use the arrow keys to
        move between tiles and press Enter to check the ladder.
      </p>
      <p className="text-lg">
        Climb from{" "}
        <strong className="font-display uppercase">{startWord}</strong> to{" "}
        <strong className="font-display uppercase">{endWord}</strong> in{" "}
        {rungCount} {rungCount === 1 ? "rung" : "rungs"}, changing one letter
        at a time.
      </p>
      <ol className="flex flex-col gap-4">
        <li className="flex flex-col gap-1">
          <span className="font-display text-sm uppercase">Start</span>
          <LetterTiles word={startWord} label="Start word" />
        </li>
        {rungs.map((value, position) => {
          const problem = problems.find((p) => p.position === position);
          const noteId = `rung-${position}-note`;
          return (
            <li key={position} className="flex flex-col gap-1">
              <span className="font-display text-sm uppercase">
                Rung {position + 1}
              </span>
              <RungInput
                length={length}
                value={value}
                label={`Rung ${position + 1}`}
                offset={position + 1}
                invalid={Boolean(problem)}
                describedBy={problem ? noteId : undefined}
                disabled={solved}
                onChange={(word) => update(position, word)}
                onSubmit={requestCheck}
              />
              {problem && (
                <p
                  id={noteId}
                  data-testid="rung-problem"
                  className="font-display text-sm uppercase"
                >
                  <span aria-hidden="true">&#10005; </span>
                  {REASON_TEXT[problem.reason]}
                </p>
              )}
            </li>
          );
        })}
        <li className="flex flex-col gap-1">
          <span className="font-display text-sm uppercase">End</span>
          <LetterTiles
            word={endWord}
            label="End word"
            offset={rungCount + 1}
          />
        </li>
      </ol>
    </div>
  );
}
