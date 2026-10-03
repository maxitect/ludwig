"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import {
  CellGrid,
  cellKey,
  type CellGridHandle,
  type CellKey,
  type CellPosition,
  type Direction,
} from "../_shared/cell-grid";
import type { SolverProps } from "../solver-types";
import { deriveEntries, deriveWords, type Entry } from "./derive";
import type * as schema from "./schema";

const DIRECTIONS = ["across", "down"] as const;

const LETTER = /^[A-Z]$/;

const actionClass =
  "h-8 border-2 border-border bg-background px-3 font-display text-xs font-bold tracking-[0.04em] text-foreground uppercase shadow-[3px_3px_0_var(--color-shadow)] transition-[color,background-color,box-shadow,translate] hover:bg-foreground hover:text-background focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50";

const label = (entry: Entry) =>
  `${entry.number} ${entry.direction === "across" ? "Across" : "Down"}`;

/** The entered letters as attempt cells, in the payload's cell order. */
const entered = (
  playable: ReadonlyArray<CellPosition>,
  letters: ReadonlyMap<CellKey, string>,
) =>
  playable.flatMap(({ row, col }) => {
    const letter = letters.get(cellKey(row, col));
    return letter ? [{ row, col, letter }] : [];
  });

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  checkCell,
  revealCell,
}: SolverProps<typeof schema>) {
  const entries = useMemo(() => deriveEntries(payload), [payload]);
  const cells = useMemo(
    () => new Set(payload.cells.map(({ row, col }) => cellKey(row, col))),
    [payload.cells],
  );
  const [letters, setLetters] = useState<ReadonlyMap<CellKey, string>>(
    () =>
      new Map(
        initialState?.cells.map(({ row, col, letter }) => [
          cellKey(row, col),
          letter,
        ]),
      ),
  );
  const [direction, setDirection] = useState<Direction>(
    entries[0]?.direction ?? "across",
  );
  const [active, setActive] = useState<CellPosition>(() => ({
    row: entries[0]?.row ?? payload.cells[0].row,
    col: entries[0]?.col ?? payload.cells[0].col,
  }));
  const [cellNotice, setCellNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const grid = useRef<CellGridHandle>(null);
  const clues = useRef<HTMLDivElement>(null);

  const entryAt = (position: CellPosition, along: Direction) =>
    entries.find(
      (entry) =>
        entry.direction === along &&
        entry.cells.some(
          (c) => c.row === position.row && c.col === position.col,
        ),
    );
  const activeEntry = entryAt(active, direction);
  const highlight = useMemo(
    () =>
      new Set(activeEntry?.cells.map(({ row, col }) => cellKey(row, col))),
    [activeEntry],
  );
  const words = useMemo(() => deriveWords(entries, direction), [entries, direction]);

  const filled = (map: ReadonlyMap<CellKey, string>) =>
    entered(payload.cells, map);

  useEffect(() => {
    registerCheck(() =>
      letters.size === payload.cells.length
        ? { cells: entered(payload.cells, letters) }
        : null,
    );
  }, [registerCheck, letters, payload.cells]);

  useEffect(() => {
    const list = clues.current;
    const item = list?.querySelector<HTMLElement>("[aria-current=true]");
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 2;
    }
  }, [activeEntry]);

  function setLetter(row: number, col: number, value: string) {
    const next = new Map(letters);
    if (value) next.set(cellKey(row, col), value);
    else next.delete(cellKey(row, col));
    setLetters(next);
    setCellNotice("");
    onStateChange({ cells: filled(next) });
  }

  function moveTo(position: CellPosition) {
    setActive(position);
    if (!entryAt(position, direction)) {
      const other = direction === "across" ? "down" : "across";
      if (entryAt(position, other)) setDirection(other);
    }
  }

  function selectEntry(entry: Entry) {
    setActive({ row: entry.row, col: entry.col });
    setDirection(entry.direction);
    setCellNotice("");
    grid.current?.focus();
  }

  const activeValue = letters.get(cellKey(active.row, active.col)) ?? "";
  const position = activeEntry
    ? activeEntry.cells.findIndex(
        (c) => c.row === active.row && c.col === active.col,
      ) + 1
    : 0;
  const where = activeEntry ? `${label(activeEntry)}, letter ${position}` : "";

  async function check() {
    if (!checkCell || !activeValue || busy) return;
    setBusy(true);
    const correct = await checkCell(active.row, active.col, activeValue);
    setBusy(false);
    if (correct !== null) {
      setCellNotice(`${where}: ${correct ? "correct" : "not right"}.`);
    }
    grid.current?.focus();
  }

  async function reveal() {
    if (!revealCell || busy) return;
    setBusy(true);
    const value = await revealCell(active.row, active.col);
    setBusy(false);
    if (value && LETTER.test(value)) {
      setLetter(active.row, active.col, value);
      setCellNotice(`${where}: revealed.`);
    }
    grid.current?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only">
        Type letters to fill the grid. Space switches between across and down,
        Tab moves to the next clue and Enter checks the grid.
      </p>
      <p className="min-h-7 text-lg" aria-live="polite">
        {activeEntry && (
          <>
            <span className="font-display font-bold">{label(activeEntry)}</span>{" "}
            {activeEntry.clueText}{" "}
            <span className="whitespace-nowrap">{activeEntry.enumeration}</span>
          </>
        )}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,38.5rem)_minmax(0,1fr)]">
        <CellGrid
          ref={grid}
          label="Crossword"
          rows={payload.rows}
          cols={payload.cols}
          cells={cells}
          value={(row, col) => letters.get(cellKey(row, col)) ?? ""}
          onChange={setLetter}
          accept={(char) => LETTER.test(char)}
          direction={direction}
          onDirectionChange={(next) => {
            if (entryAt(active, next)) setDirection(next);
          }}
          active={active}
          onActiveChange={moveTo}
          highlight={highlight}
          annotation={(row, col) => {
            const entry = entries.find((e) => e.row === row && e.col === col);
            return entry
              ? { content: entry.number, label: `clue ${entry.number}` }
              : undefined;
          }}
          words={words}
        />
        <div
          ref={clues}
          className="relative grid gap-6 sm:grid-cols-2 lg:max-h-[38.5rem] lg:overflow-y-auto"
        >
          {DIRECTIONS.map((along) => (
            <section key={along} aria-label={`${along} clues`}>
              <h2 className="mb-2 font-display text-sm font-bold tracking-[0.1em] uppercase">
                {along}
              </h2>
              <ol className="flex flex-col">
                {entries
                  .filter((entry) => entry.direction === along)
                  .map((entry) => {
                    const current = entry === activeEntry;
                    return (
                      <li key={entry.number}>
                        <button
                          type="button"
                          aria-current={current}
                          onClick={() => selectEntry(entry)}
                          className={cn(
                            "flex w-full gap-2 border-l-4 border-transparent px-2 py-1 text-left outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-ring",
                            current && "border-ink bg-paper-deep",
                          )}
                        >
                          <span className="w-6 shrink-0 font-display font-bold">
                            {entry.number}
                          </span>
                          <span>
                            {entry.clueText}{" "}
                            <span className="whitespace-nowrap">
                              {entry.enumeration}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ol>
            </section>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={actionClass}
          disabled={!checkCell || !activeValue || busy}
          onClick={check}
        >
          Check cell
        </button>
        <button
          type="button"
          className={actionClass}
          disabled={!revealCell || busy}
          onClick={reveal}
        >
          Reveal cell
        </button>
        <p role="status" aria-live="polite">
          {cellNotice}
        </p>
      </div>
    </div>
  );
}
