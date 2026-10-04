import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  crosswordAttemptCells,
  crosswordCells,
  crosswordClueSegments,
  crosswordClues,
  crosswordPuzzles,
  segmentSeparatorEnum,
} from "./tables";

const letter = (schema: z.ZodString) => schema.regex(/^[A-Z]$/);

const puzzleSelect = createSelectSchema(crosswordPuzzles).pick({
  style: true,
  rows: true,
  cols: true,
});
const puzzleInsert = createInsertSchema(crosswordPuzzles).pick({
  style: true,
  rows: true,
  cols: true,
});
const cellSelect = createSelectSchema(crosswordCells, { letter });
const clueSelect = createSelectSchema(crosswordClues);
const clueInsert = createInsertSchema(crosswordClues);
const segmentSelect = createSelectSchema(crosswordClueSegments);
const separator = z.enum(segmentSeparatorEnum.enumValues);
const attemptCellSelect = createSelectSchema(crosswordAttemptCells, { letter });

const lettered = cellSelect.pick({ row: true, col: true, letter: true });
const clueKey = clueSelect.pick({ direction: true, row: true, col: true });

export const solutionSchema = z.array(lettered);

/** Strict, so a cell that carries a `letter` is rejected. */
export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  cells: z.array(cellSelect.pick({ row: true, col: true }).strict()),
  clues: z.array(
    z
      .object({
        ...clueKey.shape,
        ...clueSelect.pick({ clueText: true }).shape,
        segments: z
          .array(segmentSelect.pick({ length: true, separator: true }).strict())
          .min(1),
      })
      .strict(),
  ),
});

const filledCells = z.array(
  attemptCellSelect.pick({ row: true, col: true, letter: true }),
);

export const answerSchema = z.object({ cells: filledCells });

export const attemptSchema = z.object({ cells: filledCells });

/** `separators[i]` is the break after segment i; omitted, every break is a word break. */
export const contentSchema = z.object({
  ...puzzleInsert.shape,
  cells: z.array(lettered).min(2),
  clues: z
    .array(
      z
        .object({
          ...clueKey.shape,
          ...clueInsert.pick({ clueText: true }).shape,
          segments: z.array(segmentSelect.shape.length).min(1),
          separators: z.array(separator).optional(),
        })
        .refine(
          ({ segments, separators }) =>
            !separators || separators.length === segments.length - 1,
          { message: "separators must number one fewer than segments" },
        ),
    )
    .min(1),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
