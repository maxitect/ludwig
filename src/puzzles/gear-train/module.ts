import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  gearTrainAttemptCogs,
  gearTrainAttempts,
  gearTrainBolts,
  gearTrainFixedCogs,
  gearTrainInventory,
  gearTrainPuzzles,
  gearTrainSolutionCogs,
} from "./tables";
import { verifyGearTrain } from "./verify";

export const gearTrainModule = {
  schema,
  meta: { key: "gear-train" },
  load,
  loadSolution,
  check,
  verify: verifyGearTrain,
  async upsertContent(
    tx,
    puzzleId,
    { rows, cols, targetClockwise, driver, target, bolts, inventory, solution },
  ) {
    const columns = { rows, cols, targetClockwise };
    await tx
      .insert(gearTrainPuzzles)
      .values({ ...columns, puzzleId })
      .onConflictDoUpdate({ target: gearTrainPuzzles.puzzleId, set: columns });

    await tx
      .delete(gearTrainSolutionCogs)
      .where(eq(gearTrainSolutionCogs.puzzleId, puzzleId));
    await tx
      .insert(gearTrainInventory)
      .values(inventory.map((item) => ({ ...item, puzzleId })))
      .onConflictDoUpdate({
        target: [gearTrainInventory.puzzleId, gearTrainInventory.teeth],
        set: { count: sql`excluded.count` },
      });
    await tx.delete(gearTrainInventory).where(
      and(
        eq(gearTrainInventory.puzzleId, puzzleId),
        notInArray(
          gearTrainInventory.teeth,
          inventory.map(({ teeth }) => teeth),
        ),
      ),
    );

    await tx
      .delete(gearTrainFixedCogs)
      .where(eq(gearTrainFixedCogs.puzzleId, puzzleId));
    await tx.insert(gearTrainFixedCogs).values([
      { ...driver, role: "driver", puzzleId },
      { ...target, role: "target", puzzleId },
    ]);
    await tx
      .delete(gearTrainBolts)
      .where(eq(gearTrainBolts.puzzleId, puzzleId));
    if (bolts.length) {
      await tx
        .insert(gearTrainBolts)
        .values(bolts.map((bolt) => ({ ...bolt, puzzleId })));
    }
    if (solution.length) {
      await tx
        .insert(gearTrainSolutionCogs)
        .values(solution.map((cog) => ({ ...cog, puzzleId })));
    }
  },
  async replaceAttemptState(tx, attemptId, { cogs }) {
    await tx
      .delete(gearTrainAttempts)
      .where(eq(gearTrainAttempts.attemptId, attemptId));
    await tx.insert(gearTrainAttempts).values({ attemptId });
    if (cogs.length) {
      await tx
        .insert(gearTrainAttemptCogs)
        .values(cogs.map((cog) => ({ ...cog, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(gearTrainAttempts)
      .where(eq(gearTrainAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.gearTrainAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        cogs: {
          columns: { row: true, col: true, teeth: true },
          orderBy: { row: "asc", col: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
