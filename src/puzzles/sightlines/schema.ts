import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  sightlinesAttemptMarks,
  sightlinesObservers,
  sightlinesObstacles,
  sightlinesPuzzles,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(14);
const dimension = (schema: z.ZodNumber) => schema.min(3).max(15);
const fovDeg = (schema: z.ZodNumber) => schema.min(1).max(360);

const puzzleSelect = createSelectSchema(sightlinesPuzzles, {
  rows: dimension,
  cols: dimension,
  targetRow: coordinate,
  targetCol: coordinate,
});
const puzzleInsert = createInsertSchema(sightlinesPuzzles, {
  rows: dimension,
  cols: dimension,
  targetRow: coordinate,
  targetCol: coordinate,
});
const obstacleSelect = createSelectSchema(sightlinesObstacles, {
  row: coordinate,
  col: coordinate,
});
const observerSelect = createSelectSchema(sightlinesObservers, {
  row: coordinate,
  col: coordinate,
  fovDeg,
});
const observerInsert = createInsertSchema(sightlinesObservers, {
  row: coordinate,
  col: coordinate,
  fovDeg,
});
const markSelect = createSelectSchema(sightlinesAttemptMarks, {
  row: coordinate,
  col: coordinate,
});

const cell = obstacleSelect.pick({ row: true, col: true });

/** The layout only: the blind spots are derived from it and never stored. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({
      rows: true,
      cols: true,
      targetRow: true,
      targetCol: true,
    }).shape,
    obstacles: z.array(cell.strict()),
    observers: z.array(
      observerSelect
        .pick({ row: true, col: true, facing: true, fovDeg: true })
        .strict(),
    ),
  })
  .strict();

/** The blind spots, derived from the payload. */
export const solutionSchema = z.array(cell);

export const answerSchema = z.object({
  marks: z
    .array(markSelect.pick({ row: true, col: true }))
    .refine(
      (marks) =>
        new Set(marks.map(({ row, col }) => `${row},${col}`)).size ===
        marks.length,
      { message: "marked cells must be distinct" },
    ),
});

export const attemptSchema = answerSchema;

/** The pillars are written as one string per row, `#` for a pillar and `.` for open floor. */
export const contentSchema = puzzleInsert
  .pick({ targetRow: true, targetCol: true })
  .extend({
    grid: z
      .array(z.string().regex(/^[.#]{3,15}$/))
      .min(3)
      .max(15),
    observers: z.array(
      observerInsert.pick({ row: true, col: true, facing: true, fovDeg: true }),
    ),
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
