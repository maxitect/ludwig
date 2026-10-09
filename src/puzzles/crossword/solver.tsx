"use client";

import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/cn";
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
import { deriveEntries, deriveWords, type Entry } from "./derive";
import type * as schema from "./schema";

const DIRECTIONS = ["across", "down"] as const;

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

type ClueTabsProps = {
  entries: ReadonlyArray<Entry>;
  direction: Direction;
  activeEntry: Entry | undefined;
  onDirection: (next: Direction) => void;
  onSelect: (entry: Entry) => void;
  listRef?: Ref<HTMLOListElement>;
  className?: string;
  listClassName?: string;
};

function ClueTabs({
  entries,
  direction,
  activeEntry,
  onDirection,
  onSelect,
  listRef,
  className,
  listClassName,
}: ClueTabsProps) {
  return (
    <Tabs
      className={className}
      value={direction}
      onValueChange={(value) => {
        const next = DIRECTIONS.find((along) => along === value);
        if (next) onDirection(next);
      }}
    >
      <TabsList aria-label="Clue direction">
        {DIRECTIONS.map((along) => (
          <TabsTrigger key={along} value={along}>
            {along}
          </TabsTrigger>
        ))}
      </TabsList>
      {DIRECTIONS.map((along) => (
        <TabsContent key={along} value={along}>
          <ol
            ref={along === direction ? listRef : undefined}
            className={cn("relative flex flex-col overflow-y-auto", listClassName)}
          >
            {entries
              .filter((entry) => entry.direction === along)
              .map((entry) => {
                const current = entry === activeEntry;
                return (
                  <li key={entry.number}>
                    <button
                      type="button"
                      aria-current={current}
                      onClick={() => onSelect(entry)}
                      className={cn(
                        "flex w-full gap-2 touch:min-h-11 border-l-4 border-transparent px-2 py-1 text-left outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-ring",
                        current && "border-foreground bg-muted",
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
        </TabsContent>
      ))}
    </Tabs>
  );
}

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
      </div>
      <div className="flex flex-wrap items-center gap-3 touch:contents">
        <div className="contents touch:hidden">{actions}</div>
        <p role="status" aria-live="polite" className="touch:sr-only">
          {cellNotice}
        </p>
      </div>
      <SolveSlot>
        <div className="flex flex-col gap-1 pt-2">
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
      <Sheet open={cluesOpen} onOpenChange={setCluesOpen}>
        <SheetContent
          side="bottom"
          onOpenAutoFocus={(event) => {
            if (!(event.currentTarget instanceof HTMLElement)) return;
            const current = event.currentTarget.querySelector<HTMLElement>(
              "[aria-current=true]",
            );
            if (!current) return;
            event.preventDefault();
            current.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            grid.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle>Clues</SheetTitle>
            <SheetDescription className="sr-only">
              Choose a clue to jump to its entry.
            </SheetDescription>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
