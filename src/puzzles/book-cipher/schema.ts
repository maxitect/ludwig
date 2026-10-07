import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  bookCipherAttempts,
  bookCipherRefs,
  bookTextLines,
  bookTexts,
} from "./tables";

const decoded = (schema: z.ZodString) => schema.regex(/^[a-z_ ]*$/).max(400);

const refSelect = createSelectSchema(bookCipherRefs);
const refInsert = createInsertSchema(bookCipherRefs);
const lineSelect = createSelectSchema(bookTextLines);
const textSelect = createSelectSchema(bookTexts);
const attemptSelect = createSelectSchema(bookCipherAttempts, {
  answer: decoded,
});

export const solutionSchema = z.object({
  plaintext: z.string().min(1).max(400),
});

export const payloadSchema = textSelect
  .pick({ title: true, author: true })
  .extend({
    lines: z.array(lineSelect.pick({ page: true, line: true, content: true })),
    refs: z.array(
      refSelect.pick({
        position: true,
        page: true,
        line: true,
        wordIndex: true,
      }),
    ),
  });

export const answerSchema = z.object({
  answer: z.string().min(1).max(400),
});

export const attemptSchema = attemptSelect.pick({ answer: true });

export const contentSchema = z.object({
  textSlug: textSelect.shape.slug,
  refs: z
    .array(refInsert.pick({ page: true, line: true, wordIndex: true }))
    .min(3)
    .max(12),
});

export type Solution = z.infer<typeof solutionSchema>;
export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
