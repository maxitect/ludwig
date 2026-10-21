"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitWheelWord } from "@/lib/actions/word-wheel";
import { cn } from "@/utils/cn";
import { tileClass, tilt } from "../_shared/letter-tiles/letter-tile";
import type { SolverProps } from "../solver-types";
import { fitFailure, ratingFor } from "./engine";
import type * as schema from "./schema";

const MESSAGES = {
  "too-short": (minLength: number) =>
    `Too short: words need at least ${minLength} letters.`,
  "missing-centre": () => "Every word must use the centre letter.",
  letters: () => "That uses a letter more often than the wheel has it.",
  "not-a-word": () => "Not a word we know.",
  duplicate: () => "Already found.",
  error: () => "That word could not be checked. Try again.",
} as const;

const byLengthThenAlpha = (a: string, b: string) =>
  a.length - b.length || a.localeCompare(b);

export function Solver({
  puzzleId = "",
  payload: { centre, rim, minLength, thresholds },
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [found, setFound] = useState(initialState?.words ?? []);
  const [word, setWord] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerCheck(() => null);
  }, [registerCheck]);

  function type(letters: string) {
    setMessage("");
    setWord((current) => (current + letters).slice(0, 9));
    input.current?.focus();
  }

  function submit() {
    if (pending || !word) return;
    const failure = fitFailure({ centre, rim }, minLength, word);
    if (failure) return setMessage(MESSAGES[failure](minLength));
    if (found.includes(word)) return setMessage(MESSAGES.duplicate());
    const submitted = word;
    startTransition(async () => {
      const response = await submitWheelWord(puzzleId, submitted).catch(
        () => null,
      );
      if (!response?.ok) return setMessage(MESSAGES.error());
      if (response.result !== "accepted") {
        return setMessage(MESSAGES[response.result](minLength));
      }
      const next = [...found, submitted];
      setFound(next);
      setWord("");
      setMessage(`${submitted.toUpperCase()} added.`);
      onStateChange({ words: next });
      if (response.isTarget) {
        registerCheck(() => ({ word: submitted }));
        requestCheck?.();
      }
    });
  }

  const rating = ratingFor(found.length, thresholds);
  const rimTiles = rim.map((letter, i) => {
    const angle = (i / rim.length) * 2 * Math.PI - Math.PI / 2;
    return {
      letter,
      left: 50 + Math.cos(angle) * 38,
      top: 50 + Math.sin(angle) * 38,
    };
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-4 lg:w-96">
        <p className="sr-only">
          Make words from the nine letters. Every word must use the centre
          letter and be at least {minLength} letters long. Type a word and press
          Enter. Finding the nine-letter word solves the puzzle.
        </p>
        <div
          role="group"
          aria-label="Wheel letters"
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          {rimTiles.map(({ letter, left, top }, i) => (
            <button
              key={i}
              type="button"
              disabled={solved}
              aria-label={`Letter ${letter}`}
              onClick={() => type(letter)}
              style={{ left: `${left}%`, top: `${top}%`, ...tilt(i) }}
              className={cn(
                tileClass,
                "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer",
              )}
            >
              {letter}
            </button>
          ))}
          <button
            type="button"
            disabled={solved}
            aria-label={`Centre letter ${centre}`}
            onClick={() => type(centre)}
            className={cn(
              tileClass,
              "absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-4 bg-foreground text-4xl text-background sm:size-24",
            )}
          >
            {centre}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="wheel-word" className="font-display text-sm uppercase">
            Your word
          </label>
          <input
            ref={input}
            id="wheel-word"
            type="text"
            inputMode="none"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={solved}
            value={word}
            maxLength={9}
            aria-describedby="wheel-message"
            onChange={(event) => {
              setMessage("");
              setWord(event.target.value.toLowerCase().replace(/[^a-z]/g, ""));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            className="h-12 border-2 border-border bg-card px-3 font-hand text-3xl text-hand uppercase focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={submit}
              disabled={solved || pending || !word}
            >
              Enter
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMessage("");
                setWord((current) => current.slice(0, -1));
                input.current?.focus();
              }}
              disabled={solved || !word}
            >
              Delete
            </Button>
          </div>
          <p
            id="wheel-message"
            role="status"
            data-testid="wheel-message"
            className="min-h-6"
          >
            {message}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-1">
        <h2 className="font-display text-xl uppercase">
          Found <span className="font-mono tabular-nums">{found.length}</span>
        </h2>
        <p data-testid="wheel-rating">
          {rating ? `Rating: ${rating}.` : "No rating yet."} Average at{" "}
          {thresholds.average} words, Good at {thresholds.good}, Genius at{" "}
          {thresholds.genius}.
        </p>
        <ul
          aria-label="Found words"
          className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-lg uppercase"
        >
          {found.toSorted(byLengthThenAlpha).map((value) => (
            <li key={value} className={cn(value.length === 9 && "font-bold")}>
              {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
