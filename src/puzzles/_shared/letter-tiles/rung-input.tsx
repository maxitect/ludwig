"use client";

import { useRef } from "react";
import { cn } from "@/utils/cn";
import { tileClass, tilt } from "./letter-tile";

type Props = {
  length: number;
  /** The letters typed so far, packed from the left: a to z only, at most `length`. */
  value: string;
  onChange(value: string): void;
  /** Accessible name of the row, such as "Rung 2". */
  label: string;
  /** Position in the puzzle, which seeds the tile tilt. */
  offset?: number;
  /** Marks the row invalid: a dashed border and `aria-invalid`, never colour alone. */
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  onSubmit?(): void;
};

const LETTER = /[a-z]/g;

/**
 * One editable word as a row of letter tiles. Typing fills the next tile and moves on, Backspace
 * and Delete remove a letter, the arrow keys move between tiles and pasting a word fills the row.
 * The value is always packed from the left, so it never has gaps.
 */
export function RungInput({
  length,
  value,
  onChange,
  label,
  offset = 0,
  invalid = false,
  describedBy,
  disabled = false,
  onSubmit,
}: Props) {
  const tiles = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (index: number) =>
    tiles.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  function onKeyDown(index: number, event: React.KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Enter") {
      onSubmit?.();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const target = event.key === "Backspace" && index >= value.length ? index - 1 : index;
      if (target < 0 || target >= value.length) return focus(target);
      onChange(value.slice(0, target) + value.slice(target + 1));
      focus(target);
    } else if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      const at = Math.min(index, value.length);
      const letter = event.key.toLowerCase();
      onChange(
        (value.slice(0, at) + letter + value.slice(at + 1)).slice(0, length),
      );
      focus(at + 1);
    } else if (event.key.length === 1) {
      event.preventDefault();
    }
  }

  function onPaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const letters = event.clipboardData
      .getData("text")
      .toLowerCase()
      .match(LETTER);
    if (!letters) return;
    const next = letters.join("").slice(0, length);
    onChange(next);
    focus(next.length);
  }

  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            tiles.current[index] = node;
          }}
          value={value[index] ?? ""}
          disabled={disabled}
          aria-label={`${label}, letter ${index + 1}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          style={tilt(offset + index)}
          className={cn(
            tileClass,
            "w-12 text-center caret-transparent sm:w-14",
            invalid && "border-dashed border-ludwig-red",
          )}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const letters = event.target.value.toLowerCase().match(LETTER);
            if (!letters) return;
            const at = Math.min(index, value.length);
            onChange(
              (
                value.slice(0, at) +
                letters[letters.length - 1] +
                value.slice(at + 1)
              ).slice(0, length),
            );
            focus(at + 1);
          }}
        />
      ))}
    </div>
  );
}
