"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/utils/cn";
import { PuzzleKeyboard, usePadWanted } from "./puzzle-keyboard";
import { SolveSlot } from "./solve-slot";
import {
  CellGrid,
  cellKey,
  type CellGridHandle,
  type CellGridProps,
  type CellKey,
  type CellPosition,
} from "./cell-grid";

type Placed = CellPosition & { digit: number };

type DigitGridProps = Pick<
  CellGridProps,
  "label" | "cellClassName" | "edges" | "cellRem" | "annotation"
> & {
  size: number;
  givens: ReadonlyArray<Placed>;
  initialState: { cells: Placed[]; notes: Placed[] } | null;
  onStateChange(state: { cells: Placed[]; notes: Placed[] }): void;
  registerCheck(read: () => { cells: Placed[] } | null): void;
  requestCheck?(): void;
  /** Cells the last Check named as breaking a rule. */
  wrongCells?: ReadonlyArray<CellPosition>;
  /** Read to screen readers before the grid. */
  instructions: string;
  className?: string;
};

const NOTE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const position = (key: CellKey) => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};

const byPosition = (a: Placed, b: Placed) =>
  a.row - b.row || a.col - b.col || a.digit - b.digit;

/**
 * A square grid of digits 1 to `size` with read-only givens and pencil-mark notes (N toggles them).
 * The answer is registered once every cell is filled, and the last digit asks for a check.
 */
export function DigitGrid({
  size,
  givens: givenCells,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  wrongCells,
  instructions,
  className,
  ...gridProps
}: DigitGridProps) {
  const allCells = useMemo(
    () =>
      new Set<CellKey>(
        Array.from({ length: size * size }, (_, index) =>
          cellKey(Math.floor(index / size), index % size),
        ),
      ),
    [size],
  );
  const givens = useMemo(
    () =>
      new Map(
        givenCells.map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
    [givenCells],
  );
  const given = useMemo(() => new Set(givens.keys()), [givens]);
  const [digits, setDigits] = useState<ReadonlyMap<CellKey, number>>(
    () =>
      new Map(
        initialState?.cells
          .filter(({ row, col }) => !givens.has(cellKey(row, col)))
          .map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
  );
  const [notes, setNotes] = useState<ReadonlyMap<CellKey, ReadonlySet<number>>>(
    () => {
      const saved = new Map<CellKey, Set<number>>();
      for (const { row, col, digit } of initialState?.notes ?? []) {
        const key = cellKey(row, col);
        if (givens.has(key)) continue;
        saved.set(key, (saved.get(key) ?? new Set()).add(digit));
      }
      return saved;
    },
  );
  const [notesMode, setNotesMode] = useState(false);
  const checkOnEntry = useRef(false);
  const grid = useRef<CellGridHandle>(null);
  const padWanted = usePadWanted();
  const digitKeys = useMemo(
    () => Array.from({ length: size }, (_, index) => index + 1),
    [size],
  );
  const wrong = useMemo(
    () => new Set(wrongCells?.map(({ row, col }) => cellKey(row, col))),
    [wrongCells],
  );
  const complete = digits.size + givens.size === size * size;

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(allCells, (key) => ({
              ...position(key),
              digit: givens.get(key) ?? digits.get(key) ?? 0,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, allCells, givens, digits]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [digits, requestCheck]);

  function report(
    nextDigits: ReadonlyMap<CellKey, number>,
    nextNotes: ReadonlyMap<CellKey, ReadonlySet<number>>,
  ) {
    setDigits(nextDigits);
    setNotes(nextNotes);
    onStateChange({
      cells: Array.from(nextDigits, ([key, digit]) => ({
        ...position(key),
        digit,
      })).sort(byPosition),
      notes: Array.from(nextNotes, ([key, marked]) =>
        Array.from(marked, (digit) => ({ ...position(key), digit })),
      )
        .flat()
        .sort(byPosition),
    });
  }

  function change(row: number, col: number, value: string) {
    const key = cellKey(row, col);
    const nextDigits = new Map(digits);
    const nextNotes = new Map(notes);
    if (!value) {
      nextDigits.delete(key);
      nextNotes.delete(key);
    } else if (notesMode) {
      if (digits.has(key)) return;
      const marked = new Set(notes.get(key));
      const digit = Number(value);
      if (!marked.delete(digit)) marked.add(digit);
      if (marked.size) nextNotes.set(key, marked);
      else nextNotes.delete(key);
    } else {
      nextDigits.set(key, Number(value));
      nextNotes.delete(key);
      checkOnEntry.current = nextDigits.size + givens.size === size * size;
    }
    report(nextDigits, nextNotes);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === "n") setNotesMode((on) => !on);
  }

  const actions = (
    <>
      <Toggle
        pressed={notesMode}
        onPressedChange={(on) => {
          setNotesMode(on);
          grid.current?.focus();
        }}
      >
        Notes
      </Toggle>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!notes.size}
        onClick={() => {
          report(digits, new Map());
          grid.current?.focus();
        }}
      >
        Clear notes
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-6 touch:gap-0" onKeyDown={onKeyDown}>
      <p className="sr-only">{instructions}</p>
      <div className={cn("mx-auto w-full max-w-xl p-4 touch:px-0", className)}>
        <CellGrid
          {...gridProps}
          ref={grid}
          rows={size}
          cols={size}
          cells={allCells}
          value={(row, col) => {
            const key = cellKey(row, col);
            return String(givens.get(key) ?? digits.get(key) ?? "");
          }}
          onChange={change}
          accept={(char) => /^[1-9]$/.test(char) && Number(char) <= size}
          readOnly={given}
          inputMode="numeric"
          wrong={wrong}
          words={[]}
          marks={(row, col) => {
            const key = cellKey(row, col);
            const marked = notes.get(key);
            if (!marked || digits.has(key)) return null;
            return (
              <span
                aria-hidden
                className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[6%] font-hand text-[0.55em] leading-none text-ink"
              >
                {NOTE_SLOTS.map((digit) => (
                  <span
                    key={digit}
                    className="flex items-center justify-center"
                  >
                    {marked.has(digit) ? digit : ""}
                  </span>
                ))}
              </span>
            );
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 touch:contents">
        <div className="contents touch:hidden">{actions}</div>
        <p role="status" aria-live="polite" className="touch:sr-only">
          {notesMode ? "Notes on: digits are pencilled in." : ""}
        </p>
      </div>
      <SolveSlot>
        <div className="flex flex-col gap-1 pt-2">
          {!padWanted && (
            <div
              className="flex gap-1 [&>*]:flex-1"
              onMouseDown={(event) => event.preventDefault()}
            >
              {actions}
            </div>
          )}
          <PuzzleKeyboard
            layout="digits"
            digits={digitKeys}
            onKey={(char) => grid.current?.type(char)}
            onErase={() => grid.current?.erase()}
          >
            {actions}
          </PuzzleKeyboard>
        </div>
      </SolveSlot>
    </div>
  );
}
