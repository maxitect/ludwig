import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  logicGridAttemptMarks,
  logicGridAttemptStruckClues,
  logicGridAttempts,
  logicGridCategories,
  logicGridClues,
  logicGridItems,
  logicGridPuzzles,
  logicGridSolutionLinks,
} from "./tables";
import { verifyLogicGrid } from "./verify";

const tuple = (...values: number[]) => sql`(${sql.join(values, sql`, `)})`;

export const logicGridModule = {
  schema,
  meta: { key: "logic-grid" },
  load,
  loadSolution,
  check,
  verify: verifyLogicGrid,
  async upsertContent(tx, puzzleId, { categories, solution, clues }) {
    await tx
      .insert(logicGridPuzzles)
      .values({ puzzleId })
      .onConflictDoNothing();
    await tx
      .insert(logicGridCategories)
      .values(categories.map(({ name }, position) => ({ puzzleId, position, name })))
      .onConflictDoUpdate({
        target: [logicGridCategories.puzzleId, logicGridCategories.position],
        set: { name: sql`excluded.name` },
      });

    await tx
      .update(logicGridClues)
      .set({ isFalse: false })
      .where(eq(logicGridClues.puzzleId, puzzleId));
    await tx.delete(logicGridClues).where(
      and(
        eq(logicGridClues.puzzleId, puzzleId),
        notInArray(
          logicGridClues.position,
          clues.map((_, position) => position),
        ),
      ),
    );
    await tx
      .insert(logicGridClues)
      .values(
        clues.map(({ content, isFalse }, position) => ({
          puzzleId,
          position,
          content,
          isFalse: Boolean(isFalse),
        })),
      )
      .onConflictDoUpdate({
        target: [logicGridClues.puzzleId, logicGridClues.position],
        set: {
          content: sql`excluded.content`,
          isFalse: sql`excluded.is_false`,
        },
      });

    await tx
      .delete(logicGridSolutionLinks)
      .where(eq(logicGridSolutionLinks.puzzleId, puzzleId));
    const slots = categories.flatMap(({ items }, categoryPosition) =>
      items.map((label, position) => ({ categoryPosition, position, label })),
    );
    await tx.delete(logicGridItems).where(
      and(
        eq(logicGridItems.puzzleId, puzzleId),
        sql`(${logicGridItems.categoryPosition}, ${logicGridItems.position}) not in (${sql.join(
          slots.map(({ categoryPosition, position }) =>
            tuple(categoryPosition, position),
          ),
          sql`, `,
        )})`,
      ),
    );
    const items = await tx
      .insert(logicGridItems)
      .values(slots.map((slot) => ({ ...slot, puzzleId })))
      .onConflictDoUpdate({
        target: [
          logicGridItems.puzzleId,
          logicGridItems.categoryPosition,
          logicGridItems.position,
        ],
        set: { label: sql`excluded.label` },
      })
      .returning({
        id: logicGridItems.id,
        categoryPosition: logicGridItems.categoryPosition,
        label: logicGridItems.label,
      });
    await tx.delete(logicGridCategories).where(
      and(
        eq(logicGridCategories.puzzleId, puzzleId),
        notInArray(
          logicGridCategories.position,
          categories.map((_, position) => position),
        ),
      ),
    );

    const idOf = (category: number, label: string) => {
      const item = items.find(
        (row) => row.categoryPosition === category && row.label === label,
      );
      if (!item) throw new Error(`Unknown item "${label}"`);
      return item.id;
    };
    await tx.insert(logicGridSolutionLinks).values(
      solution.flatMap((row) =>
        row.slice(1).map((label, offset) => ({
          puzzleId,
          itemAId: idOf(0, row[0]),
          itemBId: idOf(offset + 1, label),
        })),
      ),
    );
  },
  async replaceAttemptState(
    tx,
    attemptId,
    { marks, struckClues, falseCluePosition },
  ) {
    await tx
      .delete(logicGridAttempts)
      .where(eq(logicGridAttempts.attemptId, attemptId));
    await tx
      .insert(logicGridAttempts)
      .values({ attemptId, falseCluePosition });
    if (marks.length) {
      await tx
        .insert(logicGridAttemptMarks)
        .values(marks.map((mark) => ({ ...mark, attemptId })));
    }
    if (struckClues.length) {
      await tx
        .insert(logicGridAttemptStruckClues)
        .values(struckClues.map((clue) => ({ ...clue, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(logicGridAttempts)
      .where(eq(logicGridAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.logicGridAttempts.findFirst({
      where: { attemptId },
      columns: { falseCluePosition: true },
      with: {
        marks: { columns: { itemAId: true, itemBId: true, mark: true } },
        struckClues: { columns: { cluePosition: true } },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
