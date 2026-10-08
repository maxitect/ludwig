import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  wordLadderAttemptRungs,
  wordLadderPuzzles,
  wordLadderSolutionRungs,
} from "./tables";

const MAX_RUNGS = 10;

/** A dictionary word: lowercase a to z, 3 to 6 letters, as the `words` CHECK requires. */
export const wordPattern = /^[a-z]{3,6}$/;

const dictionaryWord = (schema: z.ZodString) => schema.regex(wordPattern);
const typedWord = (schema: z.ZodString) => schema.regex(/^[a-z]{1,6}$/);
const rungCount = (schema: z.ZodNumber) => schema.min(1).max(MAX_RUNGS);

const puzzleSelect = createSelectSchema(wordLadderPuzzles, {
  startWord: dictionaryWord,
  endWord: dictionaryWord,
  rungCount,
});
const puzzleInsert = createInsertSchema(wordLadderPuzzles, {
  startWord: dictionaryWord,
  endWord: dictionaryWord,
});
const solutionRungSelect = createSelectSchema(wordLadderSolutionRungs, {
  word: dictionaryWord,
});
const attemptRungSelect = createSelectSchema(wordLadderAttemptRungs, {
  word: typedWord,
});

/** The dictionary words of the ladder's length, which the checker accepts rungs from. */
export const solutionSchema = z.object({
  dictionary: z.array(solutionRungSelect.shape.word),
});

export const payloadSchema = puzzleSelect.pick({
  startWord: true,
  endWord: true,
  rungCount: true,
});

/** The whole ladder, start and end words included, so an endpoint mismatch can be rejected. */
export const answerSchema = z.object({
  ladder: z
    .array(solutionRungSelect.shape.word)
    .min(3)
    .max(MAX_RUNGS + 2),
});

export const attemptSchema = z.object({
  rungs: z.array(attemptRungSelect.pick({ position: true, word: true })),
});

/** A rung the last check rejected. It depends only on the answer and the dictionary. */
export const rungProblemSchema = attemptRungSelect
  .pick({ position: true })
  .extend({ reason: z.enum(["not-a-word", "not-one-step", "repeated"]) });

export const contentSchema = puzzleInsert
  .pick({ startWord: true, endWord: true })
  .extend({
    rungs: z.array(solutionRungSelect.shape.word).min(1).max(MAX_RUNGS),
  });

export type Solution = z.infer<typeof solutionSchema>;
export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type RungProblem = z.infer<typeof rungProblemSchema>;
