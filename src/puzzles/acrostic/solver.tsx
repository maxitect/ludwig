"use client";

import { useEffect, useId, useState } from "react";
import { BoardCell, PanelCell, SolveLayout } from "../_shared/solve-layout";
import { Input } from "@/components/ui/input";
import type { SolverProps } from "../solver-types";
import { lettersOf } from "./derive";
import type * as schema from "./schema";

export function Solver({
  payload: { ruleLabel, lines },
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [answer, setAnswer] = useState(initialState?.answer ?? "");
  const inputId = useId();
  const hintId = useId();

  useEffect(() => {
    registerCheck(() => (lettersOf(answer) ? { answer: answer.trim() } : null));
  }, [registerCheck, answer]);

  return (
    <SolveLayout className="flex flex-col gap-6">
      <BoardCell className="panel:overflow-y-auto panel:pr-1 panel:pb-1">
      <figure
        aria-label="The letter"
        className="paper-sheet flex flex-col gap-3 p-4 sm:p-6"
      >
        <ol className="flex flex-col gap-2">
          {lines.map((line, position) => (
            <li key={position} className="-indent-6 pl-6 font-hand text-xl text-crayon sm:text-2xl">
              {line}
            </li>
          ))}
        </ol>
      </figure>
      </BoardCell>
      <PanelCell>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-display text-sm uppercase"
        >
          The hidden message
        </label>
        <p id={hintId} className="text-muted-foreground">
          {ruleLabel}. Spaces, capitals and punctuation do not matter. Press
          Enter to check.
        </p>
        <Input
          id={inputId}
          type="text"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
          value={answer}
          readOnly={solved}
          aria-describedby={hintId}
          onChange={(event) => {
            setAnswer(event.target.value);
            onStateChange({ answer: event.target.value || null });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              requestCheck?.();
            }
          }}
        />
      </div>
      </PanelCell>
    </SolveLayout>
  );
}
