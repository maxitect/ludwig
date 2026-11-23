"use client";

import { cn } from "@/utils/cn";
import { usePadWanted, useTouch } from "../_shared/puzzle-keyboard";
import { PanelCell, SolveLayout } from "../_shared/solve-layout";
import { CipherKeyPanel } from "../_shared/cipher-key/cipher-key-panel";
import { useCipherGuesses } from "../_shared/cipher-key/use-cipher-guesses";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

export function Solver({
  payload: { ciphertext },
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const touch = useTouch();
  const padWanted = usePadWanted();
  const keyboardOff = touch && !padWanted;
  const { guesses, guess, clear } = useCipherGuesses({
    ciphertext,
    savedAnswer: initialState?.answer,
    onStateChange,
    registerCheck,
  });

  return (
    <SolveLayout className="flex flex-col gap-4">
      <PanelCell part="head">
      <p className={cn("text-lg touch:sr-only", keyboardOff && "touch:not-sr-only")}>
        Every letter has moved the same number of places along the alphabet.
        Find the shift, then write what each letter was before it moved.
      </p>
      </PanelCell>
      <CipherKeyPanel
        ciphertext={ciphertext}
        guesses={guesses}
        onGuess={guess}
        onClear={clear}
      />
    </SolveLayout>
  );
}
