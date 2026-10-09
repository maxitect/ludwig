"use client";

import { DeleteIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { PAD_LABEL, registerPad, usePadWanted } from "./keyboard-store";

const ALPHA_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const keyClass =
  "flex h-12 min-w-0 flex-1 items-center justify-center border-2 border-border bg-card font-display text-lg font-bold text-card-foreground select-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring active:border-ludwig-red active:text-ludwig-red aria-pressed:border-ludwig-red aria-pressed:text-ludwig-red";

export type PuzzleKeyboardProps = (
  | { layout: "alpha" }
  | { layout: "digits"; digits: ReadonlyArray<number> }
) & {
  onKey: (char: string) => void;
  onErase: () => void;
  /** The solver's own buttons, such as Check cell, Notes or Clues. */
  children?: ReactNode;
  className?: string;
  /** Shows the pad on any device, for specimens such as the kitchen sink. */
  forceVisible?: boolean;
};

function Key({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={keyClass}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {children ?? label}
    </button>
  );
}

/** A fixed-height on-screen keyboard for typed solvers in solve mode. Hidden when a hardware keyboard or the device-keyboard setting is in use. */
export function PuzzleKeyboard(props: PuzzleKeyboardProps) {
  const { onKey, onErase, children, className, forceVisible } = props;
  const wanted = usePadWanted();
  useEffect(registerPad, []);
  if (!wanted && !forceVisible) return null;

  const rows =
    props.layout === "alpha"
      ? ALPHA_ROWS.map((row) => [...row])
      : [props.digits.map(String)];

  return (
    <div
      role="group"
      aria-label={PAD_LABEL}
      className={cn("flex flex-col gap-1", className)}
    >
      {children && (
        <div
          className="flex gap-1 [&>*]:flex-1"
          onPointerDown={(event) => event.preventDefault()}
        >
          {children}
        </div>
      )}
      {rows.map((row, index) => (
        <div key={index} className="flex justify-center gap-1">
          {row.map((char) => (
            <Key key={char} label={char} onPress={() => onKey(char)} />
          ))}
          {index === rows.length - 1 && (
            <Key label="Delete" onPress={onErase}>
              <DeleteIcon aria-hidden="true" className="size-5" />
            </Key>
          )}
        </div>
      ))}
    </div>
  );
}
