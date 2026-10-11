import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  spotDifferenceAttemptFound,
  spotDifferenceDifferences,
  spotDifferencePuzzles,
} from "./tables";

const puzzleSelect = createSelectSchema(spotDifferencePuzzles, {
  sceneKey: (schema) => schema.min(1),
});
const puzzleInsert = createInsertSchema(spotDifferencePuzzles, {
  sceneKey: (schema) => schema.min(1),
});
const differenceInsert = createInsertSchema(spotDifferenceDifferences, {
  x: (schema) => schema.min(0),
  y: (schema) => schema.min(0),
  width: (schema) => schema.min(1),
  height: (schema) => schema.min(1),
});
const foundSelect = createSelectSchema(spotDifferenceAttemptFound, {
  differenceIndex: (schema) => schema.min(0).max(14),
});

/** A rectangle in scene pixels, the intrinsic size of the prepared scene images. */
export const regionSchema = differenceInsert.pick({
  x: true,
  y: true,
  width: true,
  height: true,
});

/** The static facts of a scene's prepared images, kept in code beside the assets. */
export const sceneSchema = z.object({
  width: z.int().positive(),
  height: z.int().positive(),
  credit: z.object({
    artist: z.string().min(1),
    work: z.string().min(1),
    year: z.int(),
  }),
  sourceUrl: z.url(),
});

/** Every region, with the index a find is saved under. Only `check` and the tap hit-test read it. */
export const solutionSchema = z.array(
  z.object({ index: foundSelect.shape.differenceIndex, region: regionSchema }),
);

/** Strict, so no region can ride along. The count is derived from the rows, never stored. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ puzzleId: true, sceneKey: true }).shape,
    width: sceneSchema.shape.width,
    height: sceneSchema.shape.height,
    differenceCount: z.int().min(1).max(15),
  })
  .strict();

export const answerSchema = z.object({
  taps: z
    .array(z.object({ x: z.number(), y: z.number() }))
    .min(1)
    .max(15),
});

export const attemptSchema = z.object({
  found: z
    .array(foundSelect.shape.differenceIndex)
    .refine((found) => new Set(found).size === found.length, {
      message: "found differences must be distinct",
    }),
});

/** The regions are listed in difference order: the position is the stored `difference_index`. */
export const contentSchema = z.object({
  ...puzzleInsert.pick({ sceneKey: true }).shape,
  differences: z.array(regionSchema).min(1).max(15),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Region = z.infer<typeof regionSchema>;
export type Scene = z.infer<typeof sceneSchema>;
