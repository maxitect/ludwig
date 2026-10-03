import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  spotDifferenceAttemptFound,
  spotDifferencePuzzles,
} from "./tables";

/** One SVG element, as plain data: the engine builds these and the solver renders them. */
export const sceneNodeSchema = z.object({
  tag: z.enum(["g", "rect", "circle", "ellipse", "line", "path", "polygon"]),
  attrs: z.record(
    z.string().regex(/^[a-z][a-z0-9-]*$/),
    z.union([z.string(), z.number()]),
  ),
  get children() {
    return z.array(sceneNodeSchema).optional();
  },
});

export const regionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

const puzzleSelect = createSelectSchema(spotDifferencePuzzles, {
  differenceCount: (schema) => schema.min(1).max(15),
  generatorVersion: (schema) => schema.min(1),
});
const puzzleInsert = createInsertSchema(spotDifferencePuzzles, {
  sceneSeed: (schema) => schema.min(0),
  differenceCount: (schema) => schema.min(1).max(15),
  generatorVersion: (schema) => schema.min(1),
});
const foundSelect = createSelectSchema(spotDifferenceAttemptFound, {
  differenceIndex: (schema) => schema.min(0).max(14),
});

/** The stored values the scenes and differences are derived from. */
export const solutionSchema = puzzleSelect.pick({
  sceneSeed: true,
  differenceCount: true,
  generatorVersion: true,
});

/** Strict, so neither the seed, the version nor any region can ride along. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ puzzleId: true, differenceCount: true }).shape,
    scenes: z.tuple([sceneNodeSchema, sceneNodeSchema]),
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

export const contentSchema = puzzleInsert.pick({
  sceneSeed: true,
  differenceCount: true,
  generatorVersion: true,
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Region = z.infer<typeof regionSchema>;
export type SceneNode = z.infer<typeof sceneNodeSchema>;
