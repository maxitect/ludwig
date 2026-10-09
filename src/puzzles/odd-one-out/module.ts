import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  oddOneOutAttempts,
  oddOneOutItems,
  oddOneOutPuzzles,
  oddOneOutSolutions,
} from "./tables";
import { verifyOddOneOut } from "./verify";

export const oddOneOutModule = {
  schema,
  meta: { key: "odd-one-out" },
  load,
  loadSolution,
  check,
  verify: verifyOddOneOut,
  async upsertContent(tx, puzzleId, { promptText, items, solution }) {
    await tx
      .insert(oddOneOutPuzzles)
      .values({ puzzleId, promptText })
      .onConflictDoUpdate({
        target: oddOneOutPuzzles.puzzleId,
        set: { promptText },
      });
    await tx
      .insert(oddOneOutItems)
      .values(items.map((label, position) => ({ puzzleId, position, label })))
      .onConflictDoUpdate({
        target: [oddOneOutItems.puzzleId, oddOneOutItems.position],
        set: { label: sql`excluded.label` },
      });
    await tx
      .insert(oddOneOutSolutions)
      .values({ puzzleId, ...solution })
      .onConflictDoUpdate({
        target: oddOneOutSolutions.puzzleId,
        set: solution,
      });
    await tx
      .delete(oddOneOutItems)
      .where(
        and(
          eq(oddOneOutItems.puzzleId, puzzleId),
          gte(oddOneOutItems.position, items.length),
        ),
      );
  },
  async replaceAttemptState(tx, attemptId, { itemPosition }) {
    await tx
      .delete(oddOneOutAttempts)
      .where(eq(oddOneOutAttempts.attemptId, attemptId));
    await tx.insert(oddOneOutAttempts).values({ attemptId, itemPosition });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(oddOneOutAttempts)
      .where(eq(oddOneOutAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.oddOneOutAttempts.findFirst({
      where: { attemptId },
      columns: { itemPosition: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
