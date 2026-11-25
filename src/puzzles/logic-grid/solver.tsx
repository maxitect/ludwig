"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { answerFromMarks } from "./derive";
import { BoardCell, PanelCell, SolveLayout } from "../_shared/solve-layout";
import { PanelSection } from "../_shared/panel-section";
import { scrollWithin } from "../_shared/scroll-within";
import { MarkGrid, markKey } from "./mark-grid";
import type * as schema from "./schema";

type Marks = ReadonlyMap<string, "yes" | "no">;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  wrongParts,
}: SolverProps<typeof schema>) {
  const known = useMemo(
    () =>
      new Set(
        payload.categories.flatMap(({ items }) => items.map(({ id }) => id)),
      ),
    [payload.categories],
  );
  const wrongList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    scrollWithin(wrongList.current);
  }, [wrongParts]);
  const [cluesOpen, setCluesOpen] = useState(true);
  const [seenWrong, setSeenWrong] = useState(wrongParts);
  if (wrongParts !== seenWrong) {
    setSeenWrong(wrongParts);
    if (wrongParts?.length) setCluesOpen(true);
  }
  const [marks, setMarks] = useState<Marks>(
    () =>
      new Map(
        initialState?.marks
          .filter(({ itemAId, itemBId }) => known.has(itemAId) && known.has(itemBId))
          .map(({ itemAId, itemBId, mark }) => [markKey(itemAId, itemBId), mark]),
      ),
  );
  const [struck, setStruck] = useState<ReadonlySet<number>>(
    () => new Set(initialState?.struckClues.map(({ cluePosition }) => cluePosition)),
  );
  const categoryName = (position: number) =>
    payload.categories.find((category) => category.position === position)?.name;
  const speakerOf = (id: string | null) =>
    payload.categories
      .flatMap(({ items }) => items)
      .find((item) => item.id === id)?.label;
  const [falseClue, setFalseClue] = useState<number | null>(
    initialState?.falseCluePosition ?? null,
  );

  const report = (
    nextMarks: Marks,
    nextStruck: ReadonlySet<number>,
    nextFalse: number | null,
  ) => {
    onStateChange({
      marks: Array.from(nextMarks, ([key, mark]) => {
        const [itemAId, itemBId] = key.split("|");
        return { itemAId, itemBId, mark };
      }),
      struckClues: Array.from(nextStruck, (cluePosition) => ({ cluePosition })).sort(
        (a, b) => a.cluePosition - b.cluePosition,
      ),
      falseCluePosition: nextFalse,
    });
  };

  useEffect(() => {
    registerCheck(() => {
      const links = answerFromMarks(
        payload,
        Array.from(marks, ([key, mark]) => {
          const [itemAId, itemBId] = key.split("|");
          return { itemAId, itemBId, mark };
        }),
      );
      if (!links || (payload.variant && falseClue === null)) return null;
      return { links, falseCluePosition: payload.variant ? falseClue : null };
    });
  }, [registerCheck, payload, marks, falseClue]);

  return (
    <SolveLayout className="flex flex-col gap-8">
      <p id="logic-grid-help" className="sr-only">
        Each cell pairs two items. Press Space or Enter to cycle a cell through
        blank, no and yes, Backspace to clear it, and the arrow keys to move.
      </p>
      <PanelCell part="head">
      <PanelSection title="Case notes">
        <section
          aria-labelledby="logic-grid-case-notes"
          className="paper-sheet flex flex-col gap-1 p-3"
        >
          <h2
            id="logic-grid-case-notes"
            className="font-display text-sm font-bold tracking-[0.08em] uppercase panel:sr-only"
          >
            Case notes
          </h2>
          <p data-testid="logic-grid-brief">{payload.brief}</p>
        </section>
      </PanelSection>
      </PanelCell>
      <BoardCell>
      <MarkGrid
        categories={payload.categories}
        marks={marks}
        wrongParts={wrongParts}
        onCycle={(column, row, next) => {
          const key = markKey(column.id, row.id);
          const nextMarks = new Map(marks);
          if (next) nextMarks.set(key, next);
          else nextMarks.delete(key);
          setMarks(nextMarks);
          report(nextMarks, struck, falseClue);
        }}
      />
      </BoardCell>
      <PanelCell className="panel:flex panel:h-full panel:flex-col">
      {wrongParts && wrongParts.length > 0 && (
        <ul ref={wrongList} className="flex flex-col gap-1 panel:shrink-0 panel:pb-2">
          {wrongParts.map(({ first, second }) => (
            <li key={`${first}-${second}`}>
              At least one dot between{" "}
              <strong>{categoryName(first)}</strong> and{" "}
              <strong>{categoryName(second)}</strong> is wrong.
            </li>
          ))}
        </ul>
      )}
      <PanelSection
        title="Clues"
        scroll
        rows="ol > li"
        open={cluesOpen}
        onOpenChange={setCluesOpen}
      >
      <section aria-labelledby="logic-grid-clues" className="flex flex-col gap-3">
        <h2
          id="logic-grid-clues"
          className="font-display text-2xl font-bold uppercase panel:sr-only"
        >
          Clues
        </h2>
        <div
          role={payload.variant ? "radiogroup" : undefined}
          aria-label={payload.variant ? "Which statement is false?" : undefined}
        >
          {payload.variant && (
            <p className="mb-3">
              Exactly one statement is false. Name the liar.
            </p>
          )}
          <ol className="flex flex-col gap-3 panel:gap-2">
            {payload.clues.map(({ position, content, speakerItemId }) => {
              const isStruck = struck.has(position);
              const speaker = speakerOf(speakerItemId);
              const control = speaker ? "Name the liar" : "Mark the false statement";
              return (
                <li key={position} className="flex items-start gap-3">
                  <span className="w-6 shrink-0 font-mono tabular-nums">
                    {position + 1}.
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-pressed={isStruck}
                      onClick={() => {
                        const nextStruck = new Set(struck);
                        if (!nextStruck.delete(position)) nextStruck.add(position);
                        setStruck(nextStruck);
                        report(marks, nextStruck, falseClue);
                      }}
                      className={cn(
                        "cursor-pointer text-left outline-0 focus-visible:outline-2 focus-visible:outline-ring",
                        isStruck && "text-muted-foreground line-through",
                      )}
                    >
                      <span className="sr-only">Cross out clue {position + 1}: </span>
                      {speaker ? (
                        <>
                          <strong>{speaker}:</strong> “{content}”
                        </>
                      ) : (
                        content
                      )}
                    </button>
                    {payload.variant && (
                      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="false-clue"
                          aria-label={`${control}: ${speaker ? `${speaker}, ` : ""}clue ${position + 1}`}
                          checked={falseClue === position}
                          onChange={() => {
                            setFalseClue(position);
                            report(marks, struck, position);
                          }}
                          className="size-5 accent-ink"
                        />
                        <span aria-hidden>{control}</span>
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      </PanelSection>
      </PanelCell>
    </SolveLayout>
  );
}
