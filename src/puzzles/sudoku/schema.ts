import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  sudokuAttemptCells,
  sudokuAttemptNotes,
  sudokuGivens,
  sudokuRegionCells,
  sudokuRegionSets,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(8);
const digit = (schema: z.ZodNumber) => schema.min(1).max(9);

const givenSelect = createSelectSchema(sudokuGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const givenInsert = createInsertSchema(sudokuGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const cellSelect = createSelectSchema(sudokuAttemptCells, {
  row: coordinate,
  col: coordinate,
  digit,
});
const noteSelect = createSelectSchema(sudokuAttemptNotes, {
  row: coordinate,
  col: coordinate,
  digit,
});

const regionCellSelect = createSelectSchema(sudokuRegionCells, {
  row: coordinate,
  col: coordinate,
  region: coordinate,
});
const regionCellInsert = createInsertSchema(sudokuRegionCells, {
  row: coordinate,
  col: coordinate,
  region: coordinate,
});
const regionSetSelect = createSelectSchema(sudokuRegionSets);
const regionSetInsert = createInsertSchema(sudokuRegionSets);

const given = givenSelect.pick({ row: true, col: true, digit: true });
const entered = cellSelect.pick({ row: true, col: true, digit: true });
const noted = noteSelect.pick({ row: true, col: true, digit: true });

/** The solved grid, derived from the givens: one entry per cell. */
export const solutionSchema = z.array(entered).length(81);

const regionCell = regionCellSelect.pick({
  row: true,
  col: true,
  region: true,
});

/** The jigsaw regions, or the rainbow colour groups, of all 81 cells. A classic sudoku has none. */
export const regionsSchema = z.object({
  kind: regionSetSelect.shape.kind,
  cells: z.array(regionCell.strict()).length(81),
});

export const payloadSchema = z.object({
  givens: z.array(given.strict()),
  regions: regionsSchema.optional(),
});

export const answerSchema = z.object({ cells: z.array(entered).length(81) });

/** A cell that breaks a rule. Computed from the player's answer, never from the solution. */
export const wrongPartSchema = entered.pick({ row: true, col: true });

export const attemptSchema = z.object({
  cells: z.array(entered),
  notes: z.array(noted),
});

export const contentSchema = z.object({
  givens: z.array(givenInsert.pick({ row: true, col: true, digit: true })),
  regions: z
    .object({
      kind: regionSetInsert.shape.kind,
      cells: z
        .array(regionCellInsert.pick({ row: true, col: true, region: true }))
        .length(81),
    })
    .optional(),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Regions = z.infer<typeof regionsSchema>;
export type Given = z.infer<typeof given>;
