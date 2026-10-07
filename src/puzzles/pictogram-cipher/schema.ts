import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { pictogramCipherAttemptGuesses, pictogramGlyphs } from "./tables";

const glyphSelect = createSelectSchema(pictogramGlyphs);
const guessSelect = createSelectSchema(pictogramCipherAttemptGuesses);

const assetKey = glyphSelect.shape.assetKey;
const letter = glyphSelect.shape.letter;

export const solutionSchema = z.object({
  words: z.array(z.array(letter).min(1)).min(1),
});

export const payloadSchema = z.object({
  words: z.array(z.array(assetKey).min(1)).min(1),
  given: z.array(glyphSelect.pick({ assetKey: true, letter: true })),
});

export const answerSchema = z.object({
  answer: z.string().min(1).max(400),
});

export const attemptSchema = z.object({
  guesses: z.array(guessSelect.pick({ letter: true }).extend({ assetKey })),
});

export const contentSchema = z.object({
  plaintext: z
    .string()
    .regex(/^[a-z]+( [a-z]+)*$/)
    .max(200),
  given: z.array(letter).min(1).max(25),
});

export type Solution = z.infer<typeof solutionSchema>;
export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
