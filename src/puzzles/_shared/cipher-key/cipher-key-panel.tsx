"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { cellRotation } from "../cell-grid/cell-grid";
import {
  ALPHABET,
  cipherLettersIn,
  duplicatedGuesses,
  type Guesses,
} from "./cipher-key";

type Props = {
  ciphertext: string;
  guesses: Guesses;
  /** Assigns `plainLetter` to `cipherLetter`, or clears the slot when it is null. Both are lowercase a-z. */
  onGuess(cipherLetter: string, plainLetter: string | null): void;
  onClear(): void;
};

/**
 * A notebook page for substitution ciphers: the ciphertext with the player's guesses written
 * under it, and an A to Z row of slots, one per cipher letter, where guesses are assigned. A letter
 * that does not occur in the ciphertext has a disabled slot. Typing a letter fills the slot and
 * Backspace clears it. Guesses are controlled by the parent and never leave the browser on their own.
 */
export function CipherKeyPanel({
  ciphertext,
  guesses,
  onGuess,
  onClear,
}: Props) {
  const slots = useRef<Record<string, HTMLInputElement | null>>({});
  const present = new Set(cipherLettersIn(ciphertext));
  const duplicated = duplicatedGuesses(guesses);

  function focusNeighbour(letter: string, step: 1 | -1) {
    let index = ALPHABET.indexOf(letter) + step;
    while (index >= 0 && index < ALPHABET.length) {
      const next = ALPHABET[index];
      if (present.has(next)) {
        slots.current[next]?.focus();
        return;
      }
      index += step;
    }
  }

  function enter(letter: string, typed: string) {
    onGuess(letter, typed.toLowerCase());
    focusNeighbour(letter, 1);
  }

  function onKeyDown(event: React.KeyboardEvent, letter: string) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusNeighbour(letter, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusNeighbour(letter, -1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onGuess(letter, null);
    } else if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      enter(letter, event.key);
    }
  }

  const words = ciphertext.split(/\s+/).filter(Boolean);
  let letterIndex = 0;

  return (
    <div
      className="flex flex-col gap-6 border-2 border-ink bg-paper p-4 text-ink shadow-[3px_3px_0_var(--color-shadow)] sm:p-6"
    >
      <p className="sr-only">
        Each slot stands for one letter of the cipher. Type the letter you think
        it stands for, and Backspace clears it. The message below updates as you
        go.
      </p>
      <p className="sr-only">{`Ciphertext: ${ciphertext}`}</p>
      <div
        aria-hidden="true"
        className="flex flex-wrap gap-x-6 gap-y-3 leading-none"
      >
        {words.map((word, wordIndex) => (
          <span
            key={wordIndex}
            className="flex border-b-2 border-paper-shade"
          >
            {[...word].map((character, index) => {
              const lower = character.toLowerCase();
              const isLetter = /^[a-z]$/.test(lower);
              return (
                <span
                  key={index}
                  className="flex min-w-[1.5ch] flex-col items-center"
                >
                  <span className="font-mono text-lg uppercase">
                    {character}
                  </span>
                  <span
                    className="h-8 font-hand text-2xl text-crayon uppercase"
                    style={
                      isLetter
                        ? {
                            transform: `rotate(${cellRotation(letterIndex++)}deg)`,
                          }
                        : undefined
                    }
                  >
                    {isLetter ? (guesses[lower] ?? "") : ""}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {`Decoded so far: ${words
          .map((word) =>
            [...word]
              .map((character) => {
                const lower = character.toLowerCase();
                return /^[a-z]$/.test(lower)
                  ? (guesses[lower] ?? "blank")
                  : character;
              })
              .join(" "),
          )
          .join(", ")}`}
      </p>
      <div
        role="group"
        aria-label="Cipher key"
        className="flex flex-wrap gap-x-1 gap-y-3"
      >
        {[...ALPHABET].map((letter) => {
          const guess = guesses[letter];
          return (
            <label
              key={letter}
              className={cn(
                "flex flex-col items-center gap-1",
                !present.has(letter) && "opacity-30",
              )}
            >
              <span aria-hidden="true" className="font-mono text-sm uppercase">
                {letter}
              </span>
              <input
                ref={(node) => {
                  slots.current[letter] = node;
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={!present.has(letter)}
                value={guess ?? ""}
                aria-label={`Cipher letter ${letter.toUpperCase()}, ${
                  guess ? `guess ${guess.toUpperCase()}` : "no guess"
                }`}
                aria-invalid={guess !== undefined && duplicated.has(guess)}
                onKeyDown={(event) => onKeyDown(event, letter)}
                onChange={(event) => {
                  const typed = event.currentTarget.value
                    .replace(guess ?? "", "")
                    .slice(-1);
                  if (/^[a-z]$/i.test(typed)) enter(letter, typed);
                }}
                className="size-9 border-2 border-ink bg-paper text-center font-hand text-2xl text-crayon uppercase caret-transparent focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive"
              />
            </label>
          );
        })}
      </div>
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
