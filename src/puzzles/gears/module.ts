import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  gearAttemptSwaps,
  gearAttempts,
  gearMeshes,
  gearPuzzleGears,
  gearPuzzles,
  gearSolutionSwaps,
  gearSolutions,
} from "./tables";
import { verifyContent } from "./verify-stored";

const ordered = (a: string, b: string) =>
  a < b ? { gearAId: a, gearBId: b } : { gearAId: b, gearBId: a };

export const gearsModule = {
  schema,
  meta: { key: "gears" },
  verify: verifyContent,
  load,
  loadSolution,
  check,
  async upsertContent(tx, puzzleId, { gears, meshes, solution, ...puzzle }) {
    const columns = {
      slotCount: puzzle.slotCount,
      mIn: puzzle.mIn,
      mOut: puzzle.mOut,
      maxAdjustments: puzzle.maxAdjustments,
      occlusion: puzzle.occlusion,
      generatorSeed: puzzle.generatorSeed ?? null,
    };
    await tx
      .insert(gearPuzzles)
      .values({ ...columns, puzzleId })
      .onConflictDoUpdate({ target: gearPuzzles.puzzleId, set: columns });

    const driver = gears.find((gear) => gear.isDriver);
    await tx
      .update(gearPuzzleGears)
      .set({ isDriver: false })
      .where(
        and(
          eq(gearPuzzleGears.puzzleId, puzzleId),
          eq(gearPuzzleGears.isDriver, true),
          driver ? sql`${gearPuzzleGears.label} <> ${driver.label}` : undefined,
        ),
      );
    const upserted = await tx
      .insert(gearPuzzleGears)
      .values(gears.map((gear) => ({ ...gear, puzzleId })))
      .onConflictDoUpdate({
        target: [gearPuzzleGears.puzzleId, gearPuzzleGears.label],
        set: {
          teeth: sql`excluded.teeth`,
          startSlot: sql`excluded.start_slot`,
          initialOffset: sql`excluded.initial_offset`,
          halfWidthDeg: sql`excluded.half_width_deg`,
          isDriver: sql`excluded.is_driver`,
        },
      })
      .returning({ id: gearPuzzleGears.id, label: gearPuzzleGears.label });
    const idOf = (label: string) => {
      const gear = upserted.find((row) => row.label === label);
      if (!gear) throw new Error(`Unknown gear label: ${label}`);
      return gear.id;
    };
    const solutionColumns = {
      crank: solution.crank,
      convergence: solution.convergence,
      killerGearId: idOf(solution.killerLabel),
    };
    await tx
      .insert(gearSolutions)
      .values({ ...solutionColumns, puzzleId })
      .onConflictDoUpdate({
        target: gearSolutions.puzzleId,
        set: solutionColumns,
      });
    await tx.delete(gearMeshes).where(eq(gearMeshes.puzzleId, puzzleId));
    await tx
      .delete(gearSolutionSwaps)
      .where(eq(gearSolutionSwaps.puzzleId, puzzleId));
    await tx.delete(gearPuzzleGears).where(
      and(
        eq(gearPuzzleGears.puzzleId, puzzleId),
        notInArray(
          gearPuzzleGears.label,
          gears.map((gear) => gear.label),
        ),
      ),
    );
    await tx.insert(gearMeshes).values(
      meshes.map(({ a, b }) => ({
        ...ordered(idOf(a), idOf(b)),
        puzzleId,
      })),
    );
    if (!solution.swaps.length) return;
    await tx.insert(gearSolutionSwaps).values(
      solution.swaps.map(({ a, b }) => ({
        ...ordered(idOf(a), idOf(b)),
        puzzleId,
      })),
    );
  },
  async replaceAttemptState(tx, attemptId, { swaps, ...state }) {
    await tx.delete(gearAttempts).where(eq(gearAttempts.attemptId, attemptId));
    await tx.insert(gearAttempts).values({ ...state, attemptId });
    if (!swaps.length) return;
    await tx.insert(gearAttemptSwaps).values(
      swaps.map(({ gearAId, gearBId }) => ({
        ...ordered(gearAId, gearBId),
        attemptId,
      })),
    );
  },
  async clearAttemptState(attemptId) {
    await db.delete(gearAttempts).where(eq(gearAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.gearAttempts.findFirst({
      where: { attemptId },
      columns: { crank: true, convergence: true, accusedGearId: true },
      with: { swaps: { columns: { gearAId: true, gearBId: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
