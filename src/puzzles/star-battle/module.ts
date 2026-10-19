import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  starBattleAttemptMarks,
  starBattleAttempts,
  starBattlePuzzles,
  starBattleRegionCells,
} from "./tables";
import { regionCells, verifyStarBattle } from "./verify";

export const starBattleModule = {
  schema,
  meta: { key: "star-battle" },
  load,
  loadSolution,
  check,
  verify: verifyStarBattle,
  async upsertContent(tx, puzzleId, content) {
    const { size, stars } = content;
    await tx
      .insert(starBattlePuzzles)
      .values({ puzzleId, size, stars })
      .onConflictDoUpdate({
        target: starBattlePuzzles.puzzleId,
        set: { size, stars },
      });
    const cells = regionCells(content);
    await tx.delete(starBattleRegionCells).where(
      and(
        eq(starBattleRegionCells.puzzleId, puzzleId),
        sql`(${starBattleRegionCells.row}, ${starBattleRegionCells.col}) not in (${sql.join(
          cells.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(starBattleRegionCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })))
      .onConflictDoUpdate({
        target: [
          starBattleRegionCells.puzzleId,
          starBattleRegionCells.row,
          starBattleRegionCells.col,
        ],
        set: { region: sql`excluded.region` },
      });
  },
  async replaceAttemptState(tx, attemptId, { marks }) {
    await tx
      .delete(starBattleAttempts)
      .where(eq(starBattleAttempts.attemptId, attemptId));
    await tx.insert(starBattleAttempts).values({ attemptId });
    if (marks.length) {
      await tx
        .insert(starBattleAttemptMarks)
        .values(marks.map((mark) => ({ ...mark, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(starBattleAttempts)
      .where(eq(starBattleAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.starBattleAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { marks: { columns: { row: true, col: true, mark: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
