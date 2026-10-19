import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  norinoriAttemptMarks,
  norinoriPuzzles,
  norinoriRegionCells,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(11);
const extent = (schema: z.ZodNumber) => schema.min(5).max(12);

const puzzleSelect = createSelectSchema(norinoriPuzzles, {
  rows: extent,
  cols: extent,
});
const puzzleInsert = createInsertSchema(norinoriPuzzles, {
  rows: extent,
  cols: extent,
});
const regionCellSelect = createSelectSchema(norinoriRegionCells, {
  row: coordinate,
  col: coordinate,
  region: (schema) => schema.min(0),
});
const markSelect = createSelectSchema(norinoriAttemptMarks, {
  row: coordinate,
  col: coordinate,
});

const regionCell = regionCellSelect.pick({
  row: true,
  col: true,
  region: true,
});
const marked = markSelect.pick({ row: true, col: true, mark: true });
const cell = marked.pick({ row: true, col: true });

/** The grid's size and its regions. Nothing is stored for the solution. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ rows: true, cols: true }).shape,
    regions: z.array(regionCell.strict()),
  })
  .strict();

/** The solved grid: the shaded cells, solved from the regions. */
export const solutionSchema = z.array(cell);

export const answerSchema = z.object({ shaded: z.array(cell) });

/** A shaded cell that breaks the domino rule or overfills its region. Computed from the answer, never from the solution. */
export const wrongPartSchema = cell;

export const attemptSchema = z.object({ marks: z.array(marked) });

/** The regions are written as one string per row, a base 36 digit naming the region of each cell. */
export const contentSchema = puzzleInsert
  .pick({ rows: true, cols: true })
  .extend({
    grid: z
      .array(z.string().regex(/^[0-9a-z]{5,12}$/))
      .min(5)
      .max(12),
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Mark = AttemptState["marks"][number]["mark"];
