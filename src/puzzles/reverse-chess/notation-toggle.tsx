"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { saveChessNotation } from "@/lib/actions/chess-notation";
import type { Notation } from "./derive";
import type { SolverProps } from "../solver-types";

const STORAGE_KEY = "chess-notation";

const OPTIONS = [
  { value: "algebraic", label: "Algebraic" },
  { value: "descriptive", label: "Descriptive" },
] as const satisfies readonly { value: Notation; label: string }[];

const isNotation = (value: string | null): value is Notation =>
  OPTIONS.some((option) => option.value === value);

function readStored(): Notation {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isNotation(stored) ? stored : "algebraic";
  } catch {
    return "algebraic";
  }
}

/**
 * Signed in (`persisted` set) saves to user_settings; signed out saves to localStorage.
 * The solver mounts only after hydration when signed out, so reading localStorage here is safe.
 */
export function useChessNotation(persisted: SolverProps["chessNotation"]) {
  const [notation, setNotation] = useState<Notation>(
    () => persisted ?? readStored(),
  );
  const [failed, setFailed] = useState(false);

  async function choose(next: Notation) {
    const previous = notation;
    setFailed(false);
    setNotation(next);
    if (!persisted) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        setFailed(true);
      }
      return;
    }
    try {
      await saveChessNotation({ chessNotation: next });
    } catch {
      setNotation(previous);
      setFailed(true);
    }
  }

  return { notation, choose, failed };
}

type NotationToggleProps = {
  notation: Notation;
  failed: boolean;
  onChoose: (notation: Notation) => void;
};

export function NotationToggle({
  notation,
  failed,
  onChoose,
}: NotationToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display text-sm uppercase">Notation</p>
      <ToggleGroup
        type="single"
        value={notation}
        aria-label="Move notation"
        onValueChange={(next) => isNotation(next) && onChoose(next)}
      >
        {OPTIONS.map(({ value, label }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="h-10 data-[state=on]:bg-muted data-[state=on]:text-foreground"
          >
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {failed && <p role="alert">Could not save your notation.</p>}
    </div>
  );
}
