"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { SolverProps } from "../solver-types";
import { normaliseDecimal } from "./decimal";
import { answerSchema } from "./schema";
import type * as schema from "./schema";

/** The lines sit on grid paper in the hand font. The answer is a decimal typed into a text field. */
export function Solver({
  payload: { questionText, lines },
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const inputId = useId();
  const [text, setText] = useState(() =>
    initialState?.answer ? normaliseDecimal(initialState.answer) : "",
  );
  const parsed = answerSchema.safeParse({ answer: text });

  useEffect(() => {
    registerCheck(() => (parsed.success ? parsed.data : null));
  }, [registerCheck, parsed.success, parsed.data]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">{questionText}</p>
      <ol
        aria-label="Napkin workings"
        className="paper-sheet grid-paper m-0 flex list-none flex-col gap-3 p-6 sm:p-8"
      >
        {lines.map((line, index) => (
          <li key={index} className="font-hand text-2xl text-crayon sm:text-3xl">
            {line}
          </li>
        ))}
      </ol>
      <div className="flex max-w-sm flex-col gap-2">
        <label htmlFor={inputId} className="text-lg">
          Your answer
        </label>
        <Input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          disabled={solved}
          value={text}
          aria-invalid={text !== "" && !parsed.success}
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            const result = answerSchema.safeParse({ answer: next });
            onStateChange({ answer: result.success ? result.data.answer : null });
          }}
          className="font-hand text-3xl text-hand"
        />
        <p
          id={`${inputId}-hint`}
          className={
            text !== "" && !parsed.success
              ? "text-destructive"
              : "text-muted-foreground"
          }
        >
          {text !== "" && !parsed.success
            ? "Enter a number such as 42 or 3.5."
            : "A number, with a decimal point if it needs one."}
        </p>
      </div>
    </div>
  );
}
