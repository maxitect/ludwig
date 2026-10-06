"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Diagram } from "./engine";
import { partnerOf, type Swaps } from "./swaps";

/**
 * The keyboard and screen reader route to Fix the Diagram's swaps: arrows move between the gears,
 * Enter or Space selects one, and Backspace undoes the swap the focused gear is in.
 */
export function SwapPanel({
  gears,
  swaps,
  max,
  selectedId,
  notice,
  onPick,
  onUndo,
}: {
  gears: Diagram["gears"];
  swaps: Swaps;
  max: number;
  selectedId: string | null;
  notice: string | null;
  onPick(gearId: string): void;
  onUndo(gearId: string): void;
}) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const labelOf = (id: string) => gears.find((gear) => gear.id === id)!.label;

  function move(to: number) {
    const next = (to + gears.length) % gears.length;
    setActive(next);
    buttons.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const gear = gears[index]!;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onUndo(gear.id);
    }
  }

  return (
    <fieldset className="flex flex-col gap-2" data-testid="swap-panel">
      <legend className="font-display font-bold uppercase">
        Adjust the diagram
      </legend>
      <p className="text-sm">
        Select two gears to swap their starting slots. Select a swapped pair
        again, or press Backspace on one of them, to undo.
      </p>
      <p>
        <output data-testid="adjustments" className="font-bold">
          Adjustments: {swaps.length}/{max}
        </output>
      </p>
      <div className="flex flex-wrap gap-2">
        {gears.map((gear, index) => {
          const partner = partnerOf(swaps, gear.id);
          return (
            <Button
              key={gear.id}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              size="sm"
              variant={selectedId === gear.id ? "default" : "secondary"}
              aria-pressed={selectedId === gear.id}
              tabIndex={index === active ? 0 : -1}
              data-gear-button={gear.label}
              onFocus={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => onPick(gear.id)}
            >
              Gear {gear.label}
              {partner ? `, swapped with ${labelOf(partner)}` : ""}
            </Button>
          );
        })}
      </div>
      <p
        role="status"
        aria-live="polite"
        data-testid="swap-notice"
        className="min-h-6 text-sm"
      >
        {notice}
      </p>
    </fieldset>
  );
}
