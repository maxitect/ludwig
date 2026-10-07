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
        The alphabet has been rewritten behind a hidden keyword: its letters
        come first, then the rest in order. Work out which letter stands for
        which, and the keyword will show itself.
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
