"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { tileClass, tilt } from "../_shared/letter-tiles/letter-tile";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

/** Maps saved letters back to unused tile indices, skipping letters the tiles can't supply. */
function restorePlaced(tiles: string[], letters: string) {
  const placed: number[] = [];
  for (const letter of letters) {
    const index = tiles.findIndex(
      (tile, i) => tile === letter && !placed.includes(i),
    );
    if (index !== -1) placed.push(index);
  }
  return placed;
}

function shuffled(length: number) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function Solver({
  payload: { tiles, wordLengths, definitionHint },
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const [placed, setPlaced] = useState(() =>
    restorePlaced(tiles, initialState?.answer ?? ""),
  );
  const [order, setOrder] = useState(() => tiles.map((_, i) => i));
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerCheck(() =>
      placed.length === tiles.length
        ? { answer: placed.map((i) => tiles[i]).join("") }
        : null,
    );
  }, [registerCheck, placed, tiles]);

  function update(next: number[]) {
    setPlaced(next);
    onStateChange({
      answer: next.length ? next.map((i) => tiles[i]).join("") : null,
    });
  }

  function place(index: number) {
    if (placed.length < tiles.length && !placed.includes(index)) {
      update([...placed, index]);
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      update(placed.slice(0, -1));
    } else if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      const letter = event.key.toLowerCase();
      const index = tiles.findIndex(
        (tile, i) => tile === letter && !placed.includes(i),
      );
      if (index !== -1) place(index);
    }
  }

  let slot = 0;

  return (
    <div className="flex flex-col gap-6">
      {definitionHint && <p className="text-lg">{definitionHint}</p>}
      <p className="sr-only">
        Type letters to fill the slots. Backspace removes the last letter and
        Enter checks the answer.
      </p>
      <div
        ref={board}
        role="group"
        aria-label="Anagram"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex w-fit max-w-full flex-col gap-6 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          {wordLengths.map((length, word) => (
            <div
              key={word}
              role="group"
              aria-label={`Word ${word + 1}, ${length} letters`}
              className="flex gap-2"
            >
              {Array.from({ length }, () => {
                const position = slot++;
                const tile = placed[position];
                return tile === undefined ? (
                  <span
                    key={position}
                    role="img"
                    aria-label={`Slot ${position + 1}, empty`}
                    className="size-12 border-2 border-dashed border-border sm:size-14"
                  />
                ) : (
                  <button
                    key={position}
                    type="button"
                    aria-label={`Slot ${position + 1}, ${tiles[tile]}. Remove`}
                    style={tilt(position)}
                    className={tileClass}
                    onClick={() => {
                      update(placed.filter((_, i) => i !== position));
                      board.current?.focus();
                    }}
                  >
                    {tiles[tile]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Tiles" role="group">
          {order.map((index, position) => {
            const used = placed.includes(index);
            return (
              <button
                key={index}
                type="button"
                disabled={used}
                aria-label={`Tile ${tiles[index]}`}
                style={tilt(position + 2)}
                className={cn(tileClass, used && "opacity-30 shadow-none")}
                onClick={() => {
                  place(index);
                  board.current?.focus();
                }}
              >
                {tiles[index]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOrder(shuffled(tiles.length))}
        >
          Shuffle
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            update([]);
            board.current?.focus();
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
