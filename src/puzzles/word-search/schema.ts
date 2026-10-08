import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  wordSearchAttemptFound,
  wordSearchCells,
  wordSearchPuzzles,
  wordSearchWords,
} from "./tables";

const letter = (schema: z.ZodString) => schema.regex(/^[A-Z]$/);
const word = (schema: z.ZodString) => schema.regex(/^[A-Z]{3,15}$/);

const puzzleSelect = createSelectSchema(wordSearchPuzzles).pick({
  rows: true,
  cols: true,
});
const cellSelect = createSelectSchema(wordSearchCells, { letter });
const wordSelect = createSelectSchema(wordSearchWords, { word });
const foundSelect = createSelectSchema(wordSearchAttemptFound, { word });

const position = cellSelect.pick({ row: true, col: true });
const wordText = wordSelect.shape.word;

/** The letters are not secret: anyone can derive every placement from the payload. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.shape,
    cells: z.array(cellSelect.pick({ row: true, col: true, letter: true }).strict()),
    words: z.array(wordText),
  })
  .strict();

export const solutionSchema = z.array(
  z.object({ word: wordText, start: position, end: position }),
);

/** The two end cells of each selection the player made; a word may be given in either direction. */
export const answerSchema = z.object({
  selections: z.array(z.object({ start: position, end: position })),
});

export const attemptSchema = z.object({
  found: z.array(foundSelect.shape.word),
});

/** The grid is written as one string per row, and the hidden words as plain text. */
export const contentSchema = z.object({
  grid: z
    .array(z.string().regex(/^[A-Z]{3,15}$/))
    .min(3)
    .max(15),
  words: z.array(wordText).min(1),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
