import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
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

const ordered = (a: string, b: string) =>
  a < b ? { gearAId: a, gearBId: b } : { gearAId: b, gearBId: a };

export const gearsModule = {
  schema,
  meta: { key: "gears" },
  load,
  loadSolution,
  check() {
    throw new Error("Gear checking is implemented in a later ticket");
  },
  async insertContent(tx, puzzleId, { gears, meshes, solution, ...puzzle }) {
    await tx.insert(gearPuzzles).values({ ...puzzle, puzzleId });
    const inserted = await tx
      .insert(gearPuzzleGears)
      .values(gears.map((gear) => ({ ...gear, puzzleId })))
      .returning({ id: gearPuzzleGears.id, label: gearPuzzleGears.label });
    const idOf = (label: string) => {
      const gear = inserted.find((row) => row.label === label);
      if (!gear) throw new Error(`Unknown gear label: ${label}`);
      return gear.id;
    };
    await tx.insert(gearMeshes).values(
      meshes.map(({ a, b }) => ({
        ...ordered(idOf(a), idOf(b)),
        puzzleId,
      })),
    );
    await tx.insert(gearSolutions).values({
      puzzleId,
      crank: solution.crank,
      convergence: solution.convergence,
      killerGearId: idOf(solution.killerLabel),
    });
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
