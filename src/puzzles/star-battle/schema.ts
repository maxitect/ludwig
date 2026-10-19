import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  starBattleAttemptMarks,
  starBattlePuzzles,
  starBattleRegionCells,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(9);
const size = (schema: z.ZodNumber) => schema.min(5).max(10);
const stars = (schema: z.ZodNumber) => schema.min(1).max(2);

const puzzleSelect = createSelectSchema(starBattlePuzzles, { size, stars });
const puzzleInsert = createInsertSchema(starBattlePuzzles, { size, stars });
const regionCellSelect = createSelectSchema(starBattleRegionCells, {
  row: coordinate,
  col: coordinate,
  region: coordinate,
});
const markSelect = createSelectSchema(starBattleAttemptMarks, {
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

/** The grid's size, its stars per unit and its regions. Nothing is stored for the solution. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ size: true, stars: true }).shape,
    regions: z.array(regionCell.strict()),
  })
  .strict();

/** The solved grid: the cells holding a star, solved from the regions. */
export const solutionSchema = z.array(cell);

export const answerSchema = z.object({ stars: z.array(cell) });

/** A star that touches another or overfills its row, column or region. Computed from the answer, never from the solution. */
export const wrongPartSchema = cell;

export const attemptSchema = z.object({ marks: z.array(marked) });

/** The regions are written as one string per row, a digit naming the region of each cell. */
export const contentSchema = puzzleInsert.pick({ size: true, stars: true }).extend({
  grid: z
    .array(z.string().regex(/^[0-9]{5,10}$/))
    .min(5)
    .max(10),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Mark = AttemptState["marks"][number]["mark"];
