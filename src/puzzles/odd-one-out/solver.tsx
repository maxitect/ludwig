"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

/** The items are one native radio group: Tab enters it, the arrow keys move the choice. */
export function Solver({
  payload: { promptText, items },
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const name = useId();
  const [chosen, setChosen] = useState<number | null>(() =>
    items.some(({ position }) => position === initialState?.itemPosition)
      ? (initialState?.itemPosition ?? null)
      : null,
  );

  useEffect(() => {
    registerCheck(() => (chosen === null ? null : { itemPosition: chosen }));
  }, [registerCheck, chosen]);

  return (
    <fieldset
      disabled={solved}
      className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0"
    >
      <legend className="mb-6 text-lg">{promptText}</legend>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(({ position, label }) => {
          const selected = chosen === position;
          return (
            <li key={position}>
              <label
                className={cn(
                  "flex min-h-16 cursor-pointer items-center gap-3 border-2 border-border p-4 shadow-[3px_3px_0_var(--cast)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:disabled]:cursor-default has-[:disabled]:shadow-none",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground has-[:disabled]:border-muted-foreground has-[:disabled]:text-muted-foreground",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={position}
                  checked={selected}
                  onChange={() => {
                    setChosen(position);
                    onStateChange({ itemPosition: position });
                  }}
                  className="sr-only"
                />
                <span aria-hidden="true">{selected ? "✓" : "○"}</span>
                <span className="font-hand text-2xl sm:text-3xl">{label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
