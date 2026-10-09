import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  futoshikiAttemptCells,
  futoshikiAttemptNotes,
  futoshikiGivens,
  futoshikiInequalities,
  futoshikiPuzzles,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(6);
const digit = (schema: z.ZodNumber) => schema.min(1).max(9);
const size = (schema: z.ZodNumber) => schema.min(4).max(7);

const puzzleSelect = createSelectSchema(futoshikiPuzzles, { size });
const puzzleInsert = createInsertSchema(futoshikiPuzzles, { size });
const givenSelect = createSelectSchema(futoshikiGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const givenInsert = createInsertSchema(futoshikiGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const inequalitySelect = createSelectSchema(futoshikiInequalities, {
  row: coordinate,
  col: coordinate,
});
const inequalityInsert = createInsertSchema(futoshikiInequalities, {
  row: coordinate,
  col: coordinate,
});
const cellSelect = createSelectSchema(futoshikiAttemptCells, {
  row: coordinate,
  col: coordinate,
  digit,
});
const noteSelect = createSelectSchema(futoshikiAttemptNotes, {
  row: coordinate,
  col: coordinate,
  digit,
});

const given = givenSelect.pick({ row: true, col: true, digit: true });
const inequality = inequalitySelect.pick({
  row: true,
  col: true,
  direction: true,
  relation: true,
});
const entered = cellSelect.pick({ row: true, col: true, digit: true });
const noted = noteSelect.pick({ row: true, col: true, digit: true });

/** The solved grid, derived from the puzzle: one entry per cell. */
export const solutionSchema = z.array(entered).min(16).max(49);

export const payloadSchema = z.object({
  size: puzzleSelect.shape.size,
  givens: z.array(given.strict()),
  inequalities: z.array(inequality.strict()),
});

export const answerSchema = z.object({
  cells: z.array(entered).min(16).max(49),
});

/** A cell that breaks a rule. Computed from the player's answer, never from the solution. */
export const wrongPartSchema = entered.pick({ row: true, col: true });

export const attemptSchema = z.object({
  cells: z.array(entered),
  notes: z.array(noted),
});

/**
 * Coordinates and digits must fit the puzzle's own `size`, which a CHECK cannot see. An inequality
 * points right or down, so its neighbour must also be on the grid.
 */
export const contentSchema = z
  .object({
    size: puzzleInsert.shape.size,
    givens: z.array(givenInsert.pick({ row: true, col: true, digit: true })),
    inequalities: z.array(
      inequalityInsert.pick({
        row: true,
        col: true,
        direction: true,
        relation: true,
      }),
    ),
  })
  .superRefine(({ size, givens, inequalities }, ctx) => {
    givens.forEach(({ row, col, digit }, index) => {
      if (row >= size || col >= size || digit > size) {
        ctx.addIssue({
          code: "custom",
          path: ["givens", index],
          message: `given does not fit a ${size} by ${size} grid`,
        });
      }
    });
    inequalities.forEach(({ row, col, direction }, index) => {
      const neighbour = direction === "right" ? col + 1 : row + 1;
      if (row >= size || col >= size || neighbour >= size) {
        ctx.addIssue({
          code: "custom",
          path: ["inequalities", index],
          message: `inequality leaves a ${size} by ${size} grid`,
        });
      }
    });
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Given = z.infer<typeof given>;
export type Inequality = z.infer<typeof inequality>;
