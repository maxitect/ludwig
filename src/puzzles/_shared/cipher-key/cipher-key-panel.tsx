"use client";

import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { cellRotation } from "../cell-grid/cell-grid";
import {
  PuzzleKeyboard,
  showPad,
  usePadWanted,
  usePuzzleKeyboard,
  useTouchPhone,
} from "../puzzle-keyboard";
import { SolveSlot } from "../solve-slot";
import {
  ALPHABET,
  cipherLettersIn,
  duplicatedGuesses,
  type Guesses,
} from "./cipher-key";

const compactSymbol =
  "contents touch:[&>span]:h-8 touch:[&>span]:w-6 touch-short:[&>span]:h-6 touch-short:[&>span]:w-4.5";

type Props = {
  ciphertext: string;
  guesses: Guesses;
  /** Assigns `plainLetter` to `cipherLetter`, or clears the slot when it is null. Both are lowercase a-z. */
  onGuess(cipherLetter: string, plainLetter: string | null): void;
  onClear(): void;
  /** Draws each cipher letter as a symbol instead of a letter. `name` is its accessible name and must not reveal the plain letter. */
  symbols?: {
    render(cipherLetter: string): ReactNode;
    name(cipherLetter: string): string;
  };
  /** Guesses that are given: shown, counted as guesses, not editable, and skipped by Tab and by the advance after typing. */
  locked?: Guesses;
};

/**
 * A notebook page for substitution ciphers: the ciphertext with the player's guesses written
 * under it, and an A to Z row of slots, one per cipher letter, where guesses are assigned. A letter
 * that does not occur in the ciphertext has a disabled slot. Typing a letter fills the slot and
 * Backspace clears it. Guesses are controlled by the parent and never leave the browser on their own.
 * With `symbols` the cipher letters are drawn as symbols and only the symbols that occur get a slot.
 */
export function CipherKeyPanel({
  ciphertext,
  guesses,
  onGuess,
  onClear,
  symbols,
  locked = {},
}: Props) {
  const slots = useRef<Record<string, HTMLInputElement | null>>({});
  const [active, setActive] = useState<string | null>(null);
  const padActive = usePuzzleKeyboard();
  const padWanted = usePadWanted();
  const touch = useTouchPhone();
  const occurring = cipherLettersIn(ciphertext);
  const present = new Set(occurring);
  const duplicated = duplicatedGuesses(guesses);

  function focusNeighbour(letter: string, step: 1 | -1, skipLocked = false) {
    let index = ALPHABET.indexOf(letter) + step;
    while (index >= 0 && index < ALPHABET.length) {
      const next = ALPHABET[index];
      if (present.has(next) && !(skipLocked && next in locked)) {
        slots.current[next]?.focus();
        return;
      }
      index += step;
    }
  }

  function enter(letter: string, typed: string) {
    onGuess(letter, typed.toLowerCase());
    focusNeighbour(letter, 1, true);
  }

  function padTarget() {
    if (active && present.has(active) && !(active in locked)) return active;
    return occurring.find((letter) => !(letter in locked));
  }

  function onPadKey(char: string) {
    const target = padTarget();
    if (target) enter(target, char);
  }

  function onPadErase() {
    const target = padTarget();
    if (target) onGuess(target, null);
  }

  function onKeyDown(event: React.KeyboardEvent, letter: string) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusNeighbour(letter, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusNeighbour(letter, -1);
    } else if (letter in locked) {
      if (/^[a-z]$/i.test(event.key) || event.key === "Backspace") {
        event.preventDefault();
      }
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onGuess(letter, null);
    } else if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      enter(letter, event.key);
    }
  }

  const slotLetters = symbols ? occurring : [...ALPHABET];
  const nameOf = (letter: string) =>
    symbols ? symbols.name(letter) : `Cipher letter ${letter.toUpperCase()}`;

  const words = ciphertext.split(/\s+/).filter(Boolean);
  let letterIndex = 0;

  const keyGroup = (
    <div
      role="group"
      aria-label="Cipher key"
      className="flex flex-wrap gap-x-1 gap-y-3 touch:grid touch:grid-cols-[repeat(var(--key-columns),minmax(0,1fr))] touch:gap-0.5"
      style={
        { "--key-columns": Math.ceil(slotLetters.length / 2) } as CSSProperties
      }
    >
      {slotLetters.map((letter) => {
        const guess = guesses[letter];
        const isLocked = letter in locked;
        return (
          <label
            key={letter}
            className={cn(
              "flex flex-col items-center gap-1",
              !present.has(letter) && "text-ink-soft",
            )}
          >
            {symbols ? (
              <span className={compactSymbol}>{symbols.render(letter)}</span>
            ) : (
              <span aria-hidden="true" className="font-mono text-sm uppercase">
                {letter}
              </span>
            )}
            <input
              ref={(node) => {
                slots.current[letter] = node;
              }}
              type="text"
              inputMode={padActive ? "none" : "text"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={!present.has(letter)}
              readOnly={isLocked}
              tabIndex={isLocked ? -1 : undefined}
              value={guess ?? ""}
              aria-label={`${nameOf(letter)}, ${
                guess
                  ? `${isLocked ? "given" : "guess"} ${guess.toUpperCase()}`
                  : "no guess"
              }`}
              aria-invalid={guess !== undefined && duplicated.has(guess)}
              onFocus={() => setActive(letter)}
              onPointerDown={showPad}
              onKeyDown={(event) => onKeyDown(event, letter)}
              onChange={(event) => {
                const { value } = event.currentTarget;
                if (!value) return onGuess(letter, null);
                const typed = value.replace(guess ?? "", "").slice(-1);
                if (/^[a-z]$/i.test(typed)) enter(letter, typed);
              }}
              className={cn(
                "size-9 border-2 border-ink text-center font-hand text-2xl touch:h-9 touch:w-full touch:text-xl touch-short:h-8 uppercase caret-transparent focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:border-dashed disabled:bg-transparent",
                isLocked ? "bg-paper-shade" : "text-crayon",
              )}
            />
          </label>
        );
      })}
    </div>
  );

  const clearButton = (
    <Button type="button" variant="secondary" size="sm" onClick={onClear}>
      Clear
    </Button>
  );

  return (
    <div className="paper-sheet flex flex-col gap-6 p-4 sm:p-6 touch:gap-3 touch-short:p-3">
      <p className="sr-only">
        Each slot stands for one letter of the cipher. Type the letter you think
        it stands for, and Backspace clears it. The message below updates as you
        go.
      </p>
      <p className="sr-only">{`Ciphertext: ${
        symbols
          ? words
              .map((word) =>
                [...word]
                  .map((character) =>
                    /^[a-z]$/i.test(character)
                      ? symbols.name(character.toLowerCase())
                      : character,
                  )
                  .join(", "),
              )
              .join("; ")
          : ciphertext
      }`}</p>
      <div
        aria-hidden="true"
        data-testid="ciphertext"
        className="flex flex-wrap gap-x-6 gap-y-3 leading-none touch-short:gap-y-1"
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="flex border-b-2 border-paper-shade">
            {[...word].map((character, index) => {
              const lower = character.toLowerCase();
              const isLetter = /^[a-z]$/.test(lower);
              return (
                <span
                  key={index}
                  className="flex min-w-[1.5ch] flex-col items-center"
                >
                  {symbols && isLetter ? (
                    <span className={compactSymbol}>
                      {symbols.render(lower)}
                    </span>
                  ) : (
                    <span className="font-mono text-lg uppercase">
                      {character}
                    </span>
                  )}
                  <span
                    className="h-8 font-hand text-2xl text-crayon uppercase touch-short:h-6 touch-short:text-xl"
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
      {!touch && keyGroup}
      <div className="touch:hidden">{clearButton}</div>
      {touch && (
        <SolveSlot>
          <div className="flex flex-col gap-1 pt-2">
            <div className="paper-sheet p-1">{keyGroup}</div>
            {!padWanted && (
              <div
                className="flex gap-1 [&>*]:flex-1"
                onMouseDown={(event) => event.preventDefault()}
              >
                {clearButton}
              </div>
            )}
            <PuzzleKeyboard
              layout="alpha"
              onKey={onPadKey}
              onErase={onPadErase}
            >
              {clearButton}
            </PuzzleKeyboard>
          </div>
        </SolveSlot>
      )}
    </div>
  );
}
