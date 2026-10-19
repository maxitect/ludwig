import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  norinoriAttemptMarks,
  norinoriAttempts,
  norinoriPuzzles,
  norinoriRegionCells,
} from "./tables";
import { regionCells, verifyNorinori } from "./verify";

export const norinoriModule = {
  schema,
  meta: { key: "norinori" },
  load,
  loadSolution,
  check,
  verify: verifyNorinori,
  async upsertContent(tx, puzzleId, content) {
    const { rows, cols } = content;
    await tx
      .insert(norinoriPuzzles)
      .values({ puzzleId, rows, cols })
      .onConflictDoUpdate({
        target: norinoriPuzzles.puzzleId,
        set: { rows, cols },
      });
    const cells = regionCells(content);
    await tx.delete(norinoriRegionCells).where(
      and(
        eq(norinoriRegionCells.puzzleId, puzzleId),
        sql`(${norinoriRegionCells.row}, ${norinoriRegionCells.col}) not in (${sql.join(
          cells.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(norinoriRegionCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })))
      .onConflictDoUpdate({
        target: [
          norinoriRegionCells.puzzleId,
          norinoriRegionCells.row,
          norinoriRegionCells.col,
        ],
        set: { region: sql`excluded.region` },
      });
  },
  async replaceAttemptState(tx, attemptId, { marks }) {
    await tx
      .delete(norinoriAttempts)
      .where(eq(norinoriAttempts.attemptId, attemptId));
    await tx.insert(norinoriAttempts).values({ attemptId });
    if (marks.length) {
      await tx
        .insert(norinoriAttemptMarks)
        .values(marks.map((mark) => ({ ...mark, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(norinoriAttempts)
      .where(eq(norinoriAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.norinoriAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { marks: { columns: { row: true, col: true, mark: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
