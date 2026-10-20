import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  troixAttemptCells,
  troixAttempts,
  troixGivens,
  troixPuzzles,
} from "./tables";
import { verifyTroix } from "./verify";

export const troixModule = {
  schema,
  meta: { key: "troix" },
  load,
  loadSolution,
  check,
  verify: verifyTroix,
  async upsertContent(tx, puzzleId, { size, givens }) {
    await tx
      .insert(troixPuzzles)
      .values({ puzzleId, size })
      .onConflictDoUpdate({
        target: troixPuzzles.puzzleId,
        set: { size: sql`excluded.size` },
      });

    const keptGivens = givens.length
      ? sql`(${troixGivens.row}, ${troixGivens.col}) not in (${sql.join(
          givens.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`
      : undefined;
    await tx
      .delete(troixGivens)
      .where(and(eq(troixGivens.puzzleId, puzzleId), keptGivens));
    if (givens.length) {
      await tx
        .insert(troixGivens)
        .values(givens.map((given) => ({ ...given, puzzleId })))
        .onConflictDoUpdate({
          target: [troixGivens.puzzleId, troixGivens.row, troixGivens.col],
          set: { symbol: sql`excluded.symbol` },
        });
    }
  },
  async replaceAttemptState(tx, attemptId, { cells }) {
    await tx.delete(troixAttempts).where(eq(troixAttempts.attemptId, attemptId));
    await tx.insert(troixAttempts).values({ attemptId });
    if (cells.length) {
      await tx
        .insert(troixAttemptCells)
        .values(cells.map((cell) => ({ ...cell, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db.delete(troixAttempts).where(eq(troixAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.troixAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        cells: { columns: { row: true, col: true, symbol: true } },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
