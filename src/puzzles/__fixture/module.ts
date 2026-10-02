import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { Solver } from "./solver";
import * as schema from "./schema";
import { fixtureAttemptRows, fixtureItems, fixturePuzzles } from "./tables";

export const fixtureModule = {
  schema,
  meta: { key: "__fixture" },
  async load(puzzleId) {
    const items = await db
      .select({ position: fixtureItems.position, label: fixtureItems.label })
      .from(fixtureItems)
      .where(eq(fixtureItems.puzzleId, puzzleId));
    return { items };
  },
  async loadSolution(puzzleId) {
    const [row] = await db
      .select({ note: fixturePuzzles.note })
      .from(fixturePuzzles)
      .where(eq(fixturePuzzles.puzzleId, puzzleId));
    return row.note;
  },
  check(_payload, solution, answer) {
    return { correct: answer.label === solution };
  },
  Solver,
  async insertContent(tx, puzzleId, content) {
    await tx.insert(fixturePuzzles).values({ puzzleId, note: content.note });
    await tx
      .insert(fixtureItems)
      .values(content.items.map((item) => ({ ...item, puzzleId })));
  },
  async replaceAttemptState(tx, attemptId, state) {
    await tx
      .delete(fixtureAttemptRows)
      .where(eq(fixtureAttemptRows.attemptId, attemptId));
    if (!state.rows.length) return;
    await tx
      .insert(fixtureAttemptRows)
      .values(state.rows.map((row) => ({ ...row, attemptId })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(fixtureAttemptRows)
      .where(eq(fixtureAttemptRows.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const rows = await db
      .select({
        position: fixtureAttemptRows.position,
        value: fixtureAttemptRows.value,
      })
      .from(fixtureAttemptRows)
      .where(eq(fixtureAttemptRows.attemptId, attemptId))
      .orderBy(fixtureAttemptRows.position);
    return rows.length ? { rows } : null;
  },
  verify(content) {
    const labels = content.items.map((item) => item.label);
    if (new Set(labels).size !== labels.length) {
      throw new Error("duplicate item label: solution is not unique");
    }
  },
} satisfies PuzzleTypeModule<typeof schema, string>;
