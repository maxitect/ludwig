import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  troixAttemptCells,
  troixGivens,
  troixPuzzles,
  troixSymbolEnum,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(8);
const size = (schema: z.ZodNumber) => schema.refine((n) => n === 6 || n === 9);

const puzzleSelect = createSelectSchema(troixPuzzles, { size });
const puzzleInsert = createInsertSchema(troixPuzzles, { size });
const givenSelect = createSelectSchema(troixGivens, {
  row: coordinate,
  col: coordinate,
});
const givenInsert = createInsertSchema(troixGivens, {
  row: coordinate,
  col: coordinate,
});
const cellSelect = createSelectSchema(troixAttemptCells, {
  row: coordinate,
  col: coordinate,
});

const given = givenSelect.pick({ row: true, col: true, symbol: true });
const entered = cellSelect.pick({ row: true, col: true, symbol: true });

export const symbolSchema = z.enum(troixSymbolEnum.enumValues);

/** The solved grid, derived from the puzzle: one entry per cell. */
export const solutionSchema = z.array(entered).min(36).max(81);

export const payloadSchema = z.object({
  size: puzzleSelect.shape.size,
  givens: z.array(given.strict()),
});

export const answerSchema = z.object({
  cells: z.array(entered).min(36).max(81),
});

/** A cell that breaks a rule. Computed from the player's answer, never from the solution. */
export const wrongPartSchema = entered.pick({ row: true, col: true });

export const attemptSchema = z.object({
  cells: z.array(entered),
});

/** Coordinates must fit the puzzle's own `size`, which a CHECK cannot see. */
export const contentSchema = z
  .object({
    size: puzzleInsert.shape.size,
    givens: z.array(givenInsert.pick({ row: true, col: true, symbol: true })),
  })
  .superRefine(({ size, givens }, ctx) => {
    givens.forEach(({ row, col }, index) => {
      if (row >= size || col >= size) {
        ctx.addIssue({
          code: "custom",
          path: ["givens", index],
          message: `given does not fit a ${size} by ${size} grid`,
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
export type TroixSymbol = z.infer<typeof symbolSchema>;
