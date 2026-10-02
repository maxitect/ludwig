import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  rotaAttemptSwaps,
  rotaAttempts,
  rotaClueMaxSwaps,
  rotaClueNeverInRank,
  rotaClueUnpoweredSquare,
  rotaClues,
  rotaSolutionSwaps,
  rotaSolutions,
  rotaWorkerSquares,
  rotaWorkers,
} from "./tables";

const clueSelect = createSelectSchema(rotaClues).pick({
  position: true,
  displayText: true,
});
const clueInsert = createInsertSchema(rotaClues).pick({ displayText: true });
const workerSelect = createSelectSchema(rotaWorkers).pick({
  id: true,
  name: true,
});
const workerInsert = createInsertSchema(rotaWorkers).pick({ name: true });
const squareSelect = createSelectSchema(rotaWorkerSquares).pick({
  phase: true,
  file: true,
  rank: true,
});
const squareInsert = createInsertSchema(rotaWorkerSquares).pick({
  file: true,
  rank: true,
});
const swapSelect = createSelectSchema(rotaSolutionSwaps).pick({
  workerAId: true,
  workerBId: true,
});
const attemptSwapSelect = createSelectSchema(rotaAttemptSwaps).pick({
  workerAId: true,
  workerBId: true,
});
const solutionSelect = createSelectSchema(rotaSolutions).pick({
  instigatorWorkerId: true,
});
const attemptSelect = createSelectSchema(rotaAttempts).pick({
  instigatorWorkerId: true,
});

const unpoweredSquare = createSelectSchema(rotaClueUnpoweredSquare, {
  kind: z.literal("unpowered_square"),
}).pick({ kind: true, file: true, rank: true });
const neverInRank = createSelectSchema(rotaClueNeverInRank, {
  kind: z.literal("never_in_rank"),
}).pick({ kind: true, workerId: true, rank: true });
const maxSwaps = createSelectSchema(rotaClueMaxSwaps, {
  kind: z.literal("max_swaps"),
}).pick({ kind: true, maxSwaps: true });
const adjacentOnly = z.strictObject({ kind: z.literal("adjacent_only") });

const clueParams = z.discriminatedUnion("kind", [
  unpoweredSquare,
  adjacentOnly,
  neverInRank,
  maxSwaps,
]);

export const clueSchema = z.intersection(clueSelect, clueParams);

export const solutionSchema = z.object({
  ...solutionSelect.shape,
  swaps: z.array(swapSelect),
});

export const payloadSchema = z.object({
  workers: z.array(
    z.object({ ...workerSelect.shape, squares: z.array(squareSelect) }),
  ),
  clues: z.array(clueSchema),
});

export const attemptSchema = z.object({
  ...attemptSelect.shape,
  swaps: z.array(attemptSwapSelect),
});

export const answerSchema = z.object({
  instigatorWorkerId: solutionSelect.shape.instigatorWorkerId,
  swaps: z.array(attemptSwapSelect),
});

const nameSwap = z.object({ a: workerInsert.shape.name, b: workerInsert.shape.name });

/** Content names workers by name and orders clues by array index; `insertContent` resolves names to ids. */
export const contentSchema = z.object({
  workers: z
    .array(
      z.object({
        ...workerInsert.shape,
        intended: squareInsert,
        final: squareInsert,
      }),
    )
    .min(2),
  clues: z.array(
    z.intersection(
      clueInsert,
      z.discriminatedUnion("kind", [
        unpoweredSquare,
        adjacentOnly,
        z.object({
          ...neverInRank.omit({ workerId: true }).shape,
          workerName: workerInsert.shape.name,
        }),
        maxSwaps,
      ]),
    ),
  ),
  solution: z.object({
    instigatorName: workerInsert.shape.name,
    swaps: z.array(nameSwap).min(1),
  }),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Clue = z.infer<typeof clueSchema>;
export type ClueParams = z.infer<typeof clueParams>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Content = z.infer<typeof contentSchema>;
