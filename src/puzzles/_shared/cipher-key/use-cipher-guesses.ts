import { useCallback, useEffect, useState } from "react";
import {
  decodeLetters,
  guessesFromLetters,
  isComplete,
  type Guesses,
} from "./cipher-key";

type Options = {
  ciphertext: string;
  /** The saved attempt `answer`: the decoded letters so far, "_" for unguessed. */
  savedAnswer: string | null | undefined;
  onStateChange(state: { answer: string | null }): void;
  /** Registers the reader the chrome calls on Check: the decoded letters, or null while any are unguessed. */
  registerCheck(read: () => { answer: string } | null): void;
};

/**
 * Working state for a cipher-key panel. Guesses live only in the browser; each change reports the
 * decoded letters as the attempt answer, and the answer is readable once every letter is guessed.
 */
export function useCipherGuesses({
  ciphertext,
  savedAnswer,
  onStateChange,
  registerCheck,
}: Options) {
  const [guesses, setGuesses] = useState<Guesses>(() =>
    guessesFromLetters(ciphertext, savedAnswer ?? null),
  );

  useEffect(() => {
    registerCheck(() =>
      isComplete(ciphertext, guesses)
        ? { answer: decodeLetters(ciphertext, guesses) }
        : null,
    );
  }, [registerCheck, ciphertext, guesses]);

  const guess = useCallback(
    (cipherLetter: string, plainLetter: string | null) => {
      const next = { ...guesses };
      if (plainLetter) next[cipherLetter] = plainLetter;
      else delete next[cipherLetter];
      setGuesses(next);
      onStateChange({
        answer: Object.keys(next).length
          ? decodeLetters(ciphertext, next)
          : null,
      });
    },
    [guesses, ciphertext, onStateChange],
  );

  const clear = useCallback(() => {
    setGuesses({});
    onStateChange({ answer: null });
  }, [onStateChange]);

  return { guesses, guess, clear };
}
