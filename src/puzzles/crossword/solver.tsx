"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  CellGrid,
  cellKey,
  type CellGridHandle,
  type CellKey,
  type CellPosition,
  type Direction,
} from "../_shared/cell-grid";
import { PuzzleKeyboard, usePadWanted } from "../_shared/puzzle-keyboard";
import { SolveBarButton } from "../_shared/solve-bar-button";
import { SolveSlot } from "../_shared/solve-slot";
import type { SolverProps } from "../solver-types";
import {
  deriveEntries,
  deriveWords,
  DIRECTIONS,
  type Entry,
} from "./derive";
import type * as schema from "./schema";

const ClueTabs = lazy(() =>
  import("./clue-tabs").then((module) => ({ default: module.ClueTabs })),
);

const ClueSheet = lazy(() =>
  import("./clue-sheet").then((module) => ({ default: module.ClueSheet })),
);

const LETTER = /^[A-Z]$/;

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

const keepFocus = (event: { preventDefault: () => void }) =>
  event.preventDefault();

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
  const [cluesOpen, setCluesOpen] = useState(false);
  const [cluesEverOpened, setCluesEverOpened] = useState(false);
  if (cluesOpen && !cluesEverOpened) setCluesEverOpened(true);
  const padWanted = usePadWanted();
  const grid = useRef<CellGridHandle>(null);
  const clueList = useRef<HTMLOListElement>(null);

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
  const sequence = useMemo(
    () =>
      DIRECTIONS.flatMap((along) =>
        entries
          .filter((entry) => entry.direction === along)
          .sort((a, b) => a.number - b.number),
      ),
    [entries],
  );

  useEffect(() => {
    registerCheck(() =>
      letters.size === payload.cells.length
        ? { cells: entered(payload.cells, letters) }
        : null,
    );
  }, [registerCheck, letters, payload.cells]);

  useEffect(() => {
    const list = clueList.current;
    const current = list?.querySelector<HTMLElement>("[aria-current=true]");
    if (!list || !current) return;
    if (current.offsetTop < list.scrollTop) {
      list.scrollTop = current.offsetTop;
    } else if (
      current.offsetTop + current.offsetHeight >
      list.scrollTop + list.clientHeight
    ) {
      list.scrollTop = current.offsetTop + current.offsetHeight - list.clientHeight;
    }
  }, [activeEntry]);

  function setLetter(row: number, col: number, value: string) {
    const next = new Map(letters);
    if (value) next.set(cellKey(row, col), value);
    else next.delete(cellKey(row, col));
    setLetters(next);
    setCellNotice("");
    onStateChange({ cells: entered(payload.cells, next) });
  }

  function moveTo(position: CellPosition) {
    setActive(position);
    if (!entryAt(position, direction)) {
      const other = direction === "across" ? "down" : "across";
      if (entryAt(position, other)) setDirection(other);
    }
  }

  function selectDirection(next: Direction) {
    if (!entryAt(active, next)) {
      const first = entries.find((entry) => entry.direction === next);
      if (!first) return;
      setActive({ row: first.row, col: first.col });
    }
    setDirection(next);
  }

  function selectEntry(entry: Entry) {
    setActive({ row: entry.row, col: entry.col });
    setDirection(entry.direction);
    setCellNotice("");
    grid.current?.focus();
  }

  function step(delta: number) {
    const at = activeEntry ? sequence.indexOf(activeEntry) : 0;
    const next = sequence[(at + delta + sequence.length) % sequence.length];
    if (next) selectEntry(next);
  }

  const crossing = entryAt(active, direction === "across" ? "down" : "across");

  function toggleDirection() {
    if (!crossing) return;
    setDirection(crossing.direction);
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

  const actions = (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!checkCell || !activeValue || busy}
        onClick={check}
      >
        Check cell
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!revealCell || busy}
        onClick={reveal}
      >
        Reveal cell
      </Button>
    </>
  );
  const cluesButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setCluesOpen(true)}
    >
      Clues
    </Button>
  );

  const clueBar = (
    <div
      data-testid="clue-bar"
      role="group"
      aria-label="Clue"
      className="flex items-stretch gap-1"
    >
      <SolveBarButton
        direction="previous"
        label="Previous clue"
        onClick={() => step(-1)}
      />
      <button
        type="button"
        disabled={!crossing}
        onMouseDown={keepFocus}
        onClick={toggleDirection}
        className="flex h-12 min-w-0 flex-1 items-center border-2 border-border bg-card px-2 text-left text-sm leading-tight text-card-foreground focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-100"
      >
        <span className="line-clamp-2">
          {cellNotice ? (
            cellNotice
          ) : activeEntry ? (
            <>
              <span className="font-display font-bold">
                {label(activeEntry)}
              </span>{" "}
              {activeEntry.clueText} {activeEntry.enumeration}
            </>
          ) : null}
        </span>
      </button>
      <SolveBarButton
        direction="next"
        label="Next clue"
        onClick={() => step(1)}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 touch:gap-0">
      <p className="sr-only">
        Type letters to fill the grid. Space switches between across and down,
        Tab moves to the next clue and Enter checks the grid.
      </p>
      <p className="min-h-7 text-lg touch:sr-only" aria-live="polite">
        {activeEntry && (
          <>
            <span className="font-display font-bold">{label(activeEntry)}</span>{" "}
            {activeEntry.clueText}{" "}
            <span className="whitespace-nowrap">{activeEntry.enumeration}</span>
          </>
        )}
      </p>
      <div className="flex flex-col gap-6">
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
        <Suspense fallback={null}>
          <ClueTabs
            className="touch:hidden"
            entries={entries}
            direction={direction}
            activeEntry={activeEntry}
            onDirection={selectDirection}
            onSelect={selectEntry}
            listRef={clueList}
            listClassName="max-h-80"
          />
        </Suspense>
      </div>
      <div className="flex flex-wrap items-center gap-3 touch:contents">
        <div className="contents touch:hidden">{actions}</div>
        <p role="status" aria-live="polite" className="touch:sr-only">
          {cellNotice}
        </p>
      </div>
      <SolveSlot
        fallback={
          <div className="hidden flex-col pt-2 touch:flex">{clueBar}</div>
        }
      >
        <div className="flex flex-col gap-1 pt-2">
          {clueBar}
          {!padWanted && (
            <div className="flex gap-1 [&>*]:flex-1" onMouseDown={keepFocus}>
              {actions}
              {cluesButton}
            </div>
          )}
          <PuzzleKeyboard
            layout="alpha"
            onKey={(char) => grid.current?.type(char)}
            onErase={() => grid.current?.erase()}
          >
            {actions}
            {cluesButton}
          </PuzzleKeyboard>
        </div>
      </SolveSlot>
      {cluesEverOpened && (
        <Suspense fallback={null}>
          <ClueSheet
            open={cluesOpen}
            onOpenChange={setCluesOpen}
            onClosed={() => grid.current?.focus()}
          >
            <ClueTabs
              className="px-4 pb-4"
              entries={entries}
              direction={direction}
              activeEntry={activeEntry}
              onDirection={selectDirection}
              onSelect={(entry) => {
                setCluesOpen(false);
                selectEntry(entry);
              }}
              listClassName="max-h-[50dvh]"
            />
          </ClueSheet>
        </Suspense>
      )}
    </div>
  );
}
