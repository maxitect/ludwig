import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { keywordAttempts, keywordPuzzles } from "./tables";

const plaintext = (schema: z.ZodString) =>
  schema.regex(/^[a-z0-9 .,;:'!?-]+$/).max(200);
const keyword = (schema: z.ZodString) => schema.regex(/^[a-z]{3,12}$/);
const decoded = (schema: z.ZodString) => schema.regex(/^[a-z_]*$/).max(200);

const puzzleSelect = createSelectSchema(keywordPuzzles, { plaintext, keyword });
const puzzleInsert = createInsertSchema(keywordPuzzles, { plaintext, keyword });
const attemptSelect = createSelectSchema(keywordAttempts, { answer: decoded });

export const solutionSchema = puzzleSelect.pick({
  plaintext: true,
  keyword: true,
});

export const payloadSchema = z.object({
  ciphertext: z.string().min(1).max(200),
});

export const answerSchema = z.object({
  answer: z.string().min(1).max(200),
});

export const attemptSchema = attemptSelect.pick({ answer: true });

export const contentSchema = puzzleInsert.pick({
  plaintext: true,
  keyword: true,
});

export type Solution = z.infer<typeof solutionSchema>;
export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
