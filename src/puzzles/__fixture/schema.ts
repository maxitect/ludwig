import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { fixtureAttemptRows, fixtureItems, fixturePuzzles } from "./tables";

export const payloadSchema = z.object({
  items: z.array(createSelectSchema(fixtureItems).omit({ puzzleId: true })),
});
export const answerSchema = z.object({ label: z.string() });
export const contentSchema = z.object({
  ...createInsertSchema(fixturePuzzles).pick({ note: true }).shape,
  items: z
    .array(createInsertSchema(fixtureItems).omit({ puzzleId: true }))
    .min(1),
});
export const attemptSchema = z.object({
  rows: z.array(
    createInsertSchema(fixtureAttemptRows).omit({ attemptId: true }),
  ),
});
