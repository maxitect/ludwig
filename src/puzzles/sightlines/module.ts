import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  sightlinesAttemptMarks,
  sightlinesAttempts,
  sightlinesObservers,
  sightlinesObstacles,
  sightlinesPuzzles,
} from "./tables";
import { verifySightlines } from "./verify";

export const sightlinesModule = {
  schema,
  meta: { key: "sightlines" },
  load,
  loadSolution,
  check: (payload, solution, answer) => ({
    correct: check(payload, solution, answer).correct,
  }),
  verify: verifySightlines,
  async upsertContent(tx, puzzleId, { grid, targetRow, targetCol, observers }) {
    const rows = grid.length;
    const cols = grid[0].length;
    await tx
      .insert(sightlinesPuzzles)
      .values({ puzzleId, rows, cols, targetRow, targetCol })
      .onConflictDoUpdate({
        target: sightlinesPuzzles.puzzleId,
        set: { rows, cols, targetRow, targetCol },
      });
    await tx
      .delete(sightlinesObstacles)
      .where(eq(sightlinesObstacles.puzzleId, puzzleId));
    const obstacles = grid.flatMap((line, row) =>
      [...line].flatMap((ch, col) =>
        ch === "#" ? [{ puzzleId, row, col }] : [],
      ),
    );
    if (obstacles.length) {
      await tx.insert(sightlinesObstacles).values(obstacles);
    }
    await tx
      .delete(sightlinesObservers)
      .where(eq(sightlinesObservers.puzzleId, puzzleId));
    await tx
      .insert(sightlinesObservers)
      .values(observers.map((observer) => ({ ...observer, puzzleId })));
  },
  async replaceAttemptState(tx, attemptId, { marks }) {
    await tx
      .delete(sightlinesAttempts)
      .where(eq(sightlinesAttempts.attemptId, attemptId));
    await tx.insert(sightlinesAttempts).values({ attemptId });
    if (marks.length) {
      await tx
        .insert(sightlinesAttemptMarks)
        .values(marks.map((mark) => ({ ...mark, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(sightlinesAttempts)
      .where(eq(sightlinesAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.sightlinesAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { marks: { columns: { row: true, col: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
