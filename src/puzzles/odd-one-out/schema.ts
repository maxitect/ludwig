import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  oddOneOutAttempts,
  oddOneOutItems,
  oddOneOutPuzzles,
  oddOneOutSolutions,
} from "./tables";

const MIN_ITEMS = 4;
const MAX_ITEMS = 5;

const puzzleInsert = createInsertSchema(oddOneOutPuzzles);
const itemSelect = createSelectSchema(oddOneOutItems);
const itemInsert = createInsertSchema(oddOneOutItems);
const solutionSelect = createSelectSchema(oddOneOutSolutions);
const solutionInsert = createInsertSchema(oddOneOutSolutions);
const attemptSelect = createSelectSchema(oddOneOutAttempts);

/** The items to choose from. The odd one and the explanation are (S) and stay on the server. */
export const payloadSchema = z
  .object({
    ...puzzleInsert.pick({ promptText: true }).shape,
    items: z.array(
      z.object(itemSelect.pick({ position: true, label: true }).shape).strict(),
    ),
  })
  .strict();

export const solutionSchema = solutionSelect.pick({
  itemPosition: true,
  explanation: true,
});

export const answerSchema = z.object({
  itemPosition: solutionSelect.shape.itemPosition,
});

export const attemptSchema = attemptSelect.pick({ itemPosition: true });

/** The items are in display order and the solution is the odd item's index plus why. */
export const contentSchema = z
  .object({
    ...puzzleInsert.pick({ promptText: true }).shape,
    items: z.array(itemInsert.shape.label).min(MIN_ITEMS).max(MAX_ITEMS),
    solution: z.object({
      itemPosition: solutionInsert.shape.itemPosition,
      explanation: solutionInsert.shape.explanation,
    }),
  })
  .strict();

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
