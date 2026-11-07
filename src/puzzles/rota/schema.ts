import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  rotaAttemptSwaps,
  rotaAttempts,
  rotaPuzzles,
  rotaClueMaxSwaps,
  rotaClueNeverInRank,
  rotaClueNotInstigator,
  rotaClueUnpoweredSquare,
  rotaClues,
  rotaSolutionSwaps,
  rotaSolutions,
  rotaWorkerSquares,
  rotaWorkers,
} from "./tables";

const rank = (schema: z.ZodNumber) => schema.min(1).max(8);

const puzzleSelect = createSelectSchema(rotaPuzzles).pick({
  brief: true,
  victimWorkerId: true,
});
const puzzleInsert = createInsertSchema(rotaPuzzles).pick({ brief: true });
const clueSelect = createSelectSchema(rotaClues).pick({
  position: true,
  displayText: true,
  speakerWorkerId: true,
});
const clueInsert = createInsertSchema(rotaClues).pick({ displayText: true });
const attemptSelect = createSelectSchema(rotaAttempts).pick({
  instigatorWorkerId: true,
});
const workerSelect = createSelectSchema(rotaWorkers).pick({
  id: true,
  name: true,
});
const workerInsert = createInsertSchema(rotaWorkers).pick({ name: true });
const squareSelect = createSelectSchema(rotaWorkerSquares, { rank }).pick({
  phase: true,
  file: true,
  rank: true,
});
const squareInsert = createInsertSchema(rotaWorkerSquares, { rank }).pick({
  file: true,
  rank: true,
});
const swapSelect = createSelectSchema(rotaSolutionSwaps).pick({
  workerAId: true,
  workerBId: true,
  excuse: true,
});
const answerSwapSelect = swapSelect.omit({ excuse: true });
const attemptSwapSelect = createSelectSchema(rotaAttemptSwaps).pick({
  workerAId: true,
  workerBId: true,
});
const solutionSelect = createSelectSchema(rotaSolutions).pick({
  instigatorWorkerId: true,
});

const unpoweredSquare = createSelectSchema(rotaClueUnpoweredSquare, {
  kind: z.literal("unpowered_square"),
  rank,
}).pick({ kind: true, file: true, rank: true });
const neverInRank = createSelectSchema(rotaClueNeverInRank, {
  kind: z.literal("never_in_rank"),
  rank,
}).pick({ kind: true, workerId: true, rank: true });
const maxSwaps = createSelectSchema(rotaClueMaxSwaps, {
  kind: z.literal("max_swaps"),
  maxSwaps: (schema) => schema.min(1),
}).pick({ kind: true, maxSwaps: true });
const notInstigator = createSelectSchema(rotaClueNotInstigator, {
  kind: z.literal("not_instigator"),
}).pick({ kind: true, workerId: true });
const adjacentOnly = z.strictObject({ kind: z.literal("adjacent_only") });

const clueParams = z.discriminatedUnion("kind", [
  unpoweredSquare,
  adjacentOnly,
  neverInRank,
  maxSwaps,
  notInstigator,
]);

export const clueSchema = z.intersection(clueSelect, clueParams);

export const solutionSchema = z.object({
  ...solutionSelect.shape,
  swaps: z.array(swapSelect),
});

export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  workers: z.array(
    z.object({ ...workerSelect.shape, squares: z.array(squareSelect) }),
  ),
  clues: z.array(clueSchema),
});

export const attemptSchema = z.object({
  swaps: z.array(attemptSwapSelect),
  instigatorWorkerId: attemptSelect.shape.instigatorWorkerId.default(null),
});

export const answerSchema = z.object({
  swaps: z.array(answerSwapSelect),
  instigatorWorkerId: z.uuid(),
});

const nameSwap = z.object({
  a: workerInsert.shape.name,
  b: workerInsert.shape.name,
  excuse: swapSelect.shape.excuse.min(1),
});
const workerName = workerInsert.shape.name;

/** Content names workers by name and orders clues by array index; `upsertContent` resolves names to ids. */
export const contentSchema = z.object({
  brief: puzzleInsert.shape.brief.min(1).max(280),
  victimName: workerName,
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
      z.object({
        ...clueInsert.shape,
        speakerName: workerName.optional(),
      }),
      z.discriminatedUnion("kind", [
        unpoweredSquare,
        adjacentOnly,
        z.object({
          ...neverInRank.omit({ workerId: true }).shape,
          workerName,
        }),
        maxSwaps,
        z.object({
          ...notInstigator.omit({ workerId: true }).shape,
          workerName,
        }),
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
