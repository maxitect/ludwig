"use client";

import { useRef, useState } from "react";
import {
  CellGrid,
  cellKey,
  type CellAnnotation,
  type CellGridHandle,
  type Direction,
} from "@/puzzles/_shared/cell-grid";
import { PuzzleKeyboard } from "@/puzzles/_shared/puzzle-keyboard";

const ROWS = 5;
const COLS = 5;
const BLOCKS = new Set([cellKey(1, 1), cellKey(1, 3), cellKey(3, 1), cellKey(3, 3)]);
const CELLS = new Set(
  Array.from({ length: ROWS * COLS }, (_, i) =>
    cellKey(Math.floor(i / COLS), i % COLS),
  ).filter((key) => !BLOCKS.has(key)),
);
const HIGHLIGHT = new Set([cellKey(0, 0), cellKey(0, 1), cellKey(0, 2), cellKey(0, 3), cellKey(0, 4)]);
const CLUES: Record<string, number> = {
  [cellKey(0, 0)]: 1,
  [cellKey(0, 2)]: 2,
  [cellKey(2, 0)]: 3,
};
const WORDS = [
  Array.from({ length: COLS }, (_, col) => ({ row: 0, col })),
  Array.from({ length: COLS }, (_, col) => ({ row: 2, col })),
  Array.from({ length: COLS }, (_, col) => ({ row: 4, col })),
];

const INITIAL: Record<string, string> = {
  [cellKey(0, 0)]: "L",
  [cellKey(0, 1)]: "U",
  [cellKey(0, 2)]: "D",
  [cellKey(2, 0)]: "W",
};

function annotation(row: number, col: number): CellAnnotation | undefined {
  const clue = CLUES[cellKey(row, col)];
  return clue ? { content: clue, label: `clue ${clue}` } : undefined;
}

export function CellGridDemo() {
  const [values, setValues] = useState(INITIAL);
  const [direction, setDirection] = useState<Direction>("across");
  const grid = useRef<CellGridHandle>(null);
  return (
    <div className="flex w-full flex-col gap-2">
      <CellGrid
        ref={grid}
        label="Demo grid"
        rows={ROWS}
        cols={COLS}
        cells={CELLS}
        value={(row, col) => values[cellKey(row, col)] ?? ""}
        onChange={(row, col, value) =>
          setValues((prev) => ({ ...prev, [cellKey(row, col)]: value }))
        }
        accept={(char) => /^[A-Z]$/.test(char)}
        direction={direction}
        onDirectionChange={setDirection}
        highlight={HIGHLIGHT}
        annotation={annotation}
        words={WORDS}
      />
      <p className="font-sans text-sm">Direction: {direction}</p>
      <PuzzleKeyboard
        layout="alpha"
        onKey={(char) => grid.current?.type(char)}
        onErase={() => grid.current?.erase()}
      />
      <p className="font-sans text-sm">Keyboard specimens (always shown)</p>
      <PuzzleKeyboard
        forceVisible
        layout="digits"
        digits={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        onKey={() => {}}
        onErase={() => {}}
      >
        <button type="button" className="h-12 border-2 border-border bg-card px-3 font-display font-bold uppercase text-card-foreground">
          Check cell
        </button>
      </PuzzleKeyboard>
    </div>
  );
}
