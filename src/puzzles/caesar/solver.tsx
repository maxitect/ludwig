"use client";

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
  const { guesses, guess, clear } = useCipherGuesses({
    ciphertext,
    savedAnswer: initialState?.answer,
    onStateChange,
    registerCheck,
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        Every letter has moved the same number of places along the alphabet.
        Find the shift, then write what each letter was before it moved.
      </p>
      <CipherKeyPanel
        ciphertext={ciphertext}
        guesses={guesses}
        onGuess={guess}
        onClear={clear}
      />
    </div>
  );
}
