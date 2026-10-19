import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  sudokuAttemptCells,
  sudokuAttemptNotes,
  sudokuCageCells,
  sudokuCages,
  sudokuGivens,
  sudokuRegionCells,
  sudokuRegionSets,
  sudokuXvMarks,
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

const cageSum = (schema: z.ZodNumber) => schema.min(1).max(45);
const cageSelect = createSelectSchema(sudokuCages, { sum: cageSum });
const cageInsert = createInsertSchema(sudokuCages, { sum: cageSum });
const cageCellSelect = createSelectSchema(sudokuCageCells, {
  row: coordinate,
  col: coordinate,
});
const cageCellInsert = createInsertSchema(sudokuCageCells, {
  row: coordinate,
  col: coordinate,
});
const xvMarkSelect = createSelectSchema(sudokuXvMarks, {
  row: coordinate,
  col: coordinate,
});
const xvMarkInsert = createInsertSchema(sudokuXvMarks, {
  row: coordinate,
  col: coordinate,
});

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

const cageCell = cageCellSelect.pick({ row: true, col: true });

/** A killer cage: the digits in its cells add up to `sum` and never repeat. */
export const cageSchema = cageSelect
  .pick({ sum: true })
  .extend({ cells: z.array(cageCell.strict()).min(1) });

const xvMark = xvMarkSelect.pick({
  row: true,
  col: true,
  direction: true,
  mark: true,
});

/** An XV sudoku: the marks between adjacent cells. Its presence turns on the negative rule. */
export const xvSchema = z.object({ marks: z.array(xvMark.strict()) });

export const payloadSchema = z.object({
  givens: z.array(given.strict()),
  regions: regionsSchema.optional(),
  cages: z.array(cageSchema).optional(),
  xv: xvSchema.optional(),
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
  cages: z
    .array(
      cageInsert.pick({ sum: true }).extend({
        cells: z
          .array(cageCellInsert.pick({ row: true, col: true }))
          .min(1),
      }),
    )
    .optional(),
  xv: z
    .object({
      marks: z.array(
        xvMarkInsert.pick({
          row: true,
          col: true,
          direction: true,
          mark: true,
        }),
      ),
    })
    .optional(),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Regions = z.infer<typeof regionsSchema>;
export type Cage = z.infer<typeof cageSchema>;
export type Xv = z.infer<typeof xvSchema>;
export type Given = z.infer<typeof given>;
