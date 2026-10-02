"use client";

import { useEffect, useState } from "react";
import type { SolverProps } from "../registry";
import type * as schema from "./schema";

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const [value, setValue] = useState(initialState?.rows[0]?.value ?? "");

  useEffect(() => {
    registerCheck(() => (value ? { label: value } : null));
  }, [registerCheck, value]);

  return (
    <label className="flex flex-col gap-2">
      <span>{payload.items[0]?.label}</span>
      <input
        value={value}
        className="border-b-2 border-border bg-transparent py-1 font-hand text-2xl focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-ring"
        onChange={(event) => {
          setValue(event.target.value);
          onStateChange({ rows: [{ position: 0, value: event.target.value }] });
        }}
      />
    </label>
  );
}
