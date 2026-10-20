import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  circle9AttemptCircles,
  circle9Attempts,
  circle9Numbers,
  circle9Puzzles,
} from "./tables";
import { numbers, verifyCircle9 } from "./verify";

export const circle9Module = {
  schema,
  meta: { key: "circle9" },
  load,
  loadSolution,
  check,
  verify: verifyCircle9,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(circle9Puzzles)
      .values({ puzzleId })
      .onConflictDoNothing({ target: circle9Puzzles.puzzleId });
    const placed = numbers(content);
    await tx.delete(circle9Numbers).where(
      and(
        eq(circle9Numbers.puzzleId, puzzleId),
        sql`(${circle9Numbers.row}, ${circle9Numbers.col}) not in (${sql.join(
          placed.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(circle9Numbers)
      .values(placed.map((number) => ({ ...number, puzzleId })))
      .onConflictDoUpdate({
        target: [
          circle9Numbers.puzzleId,
          circle9Numbers.row,
          circle9Numbers.col,
        ],
        set: { digit: sql`excluded.digit` },
      });
  },
  async replaceAttemptState(tx, attemptId, { circles }) {
    await tx
      .delete(circle9Attempts)
      .where(eq(circle9Attempts.attemptId, attemptId));
    await tx.insert(circle9Attempts).values({ attemptId });
    if (circles.length) {
      await tx
        .insert(circle9AttemptCircles)
        .values(circles.map((circle) => ({ ...circle, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(circle9Attempts)
      .where(eq(circle9Attempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.circle9Attempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { circles: { columns: { row: true, col: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
