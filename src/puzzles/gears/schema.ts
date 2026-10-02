import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  gearAttemptSwaps,
  gearAttempts,
  gearMeshes,
  gearPuzzleGears,
  gearPuzzles,
  gearSolutionSwaps,
  gearSolutions,
} from "./tables";

const puzzleSelect = createSelectSchema(gearPuzzles).omit({
  puzzleId: true,
  typeKey: true,
  generatorSeed: true,
});
const puzzleInsert = createInsertSchema(gearPuzzles).omit({ puzzleId: true });
const gearSelect = createSelectSchema(gearPuzzleGears).omit({
  puzzleId: true,
});
const gearInsert = createInsertSchema(gearPuzzleGears).omit({
  id: true,
  puzzleId: true,
});
const meshSelect = createSelectSchema(gearMeshes).omit({ puzzleId: true });
const solutionSelect = createSelectSchema(gearSolutions).omit({
  puzzleId: true,
});
const solutionSwapSelect = createSelectSchema(gearSolutionSwaps).omit({
  puzzleId: true,
});
const attemptSelect = createSelectSchema(gearAttempts).omit({
  attemptId: true,
  puzzleId: true,
  typeKey: true,
});
const attemptSwapSelect = createSelectSchema(gearAttemptSwaps).omit({
  attemptId: true,
  puzzleId: true,
});

const labelPair = z.object({ a: z.string(), b: z.string() });

export const solutionSchema = z.object({
  ...solutionSelect.shape,
  swaps: z.array(solutionSwapSelect),
});

export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  gears: z.array(gearSelect),
  meshes: z.array(meshSelect),
});

export const attemptSchema = z.object({
  ...attemptSelect.shape,
  swaps: z.array(attemptSwapSelect),
});

export const answerSchema = z.object({
  crank: attemptSelect.shape.crank,
  convergence: solutionSelect.shape.convergence,
  accusedGearId: solutionSelect.shape.killerGearId,
  swaps: z.array(attemptSwapSelect),
});

/** Content names gears by label; `insertContent` resolves labels to ids. */
export const contentSchema = z.object({
  ...puzzleInsert.shape,
  gears: z.array(gearInsert).min(2),
  meshes: z.array(labelPair).min(1),
  solution: z.object({
    crank: solutionSelect.shape.crank,
    convergence: solutionSelect.shape.convergence,
    killerLabel: z.string(),
    swaps: z.array(labelPair),
  }),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Content = z.infer<typeof contentSchema>;
