import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  detectiveSceneAttemptFound,
  detectiveSceneItemAliases,
  detectiveSceneItems,
  detectiveScenePuzzles,
} from "./tables";

const puzzleSelect = createSelectSchema(detectiveScenePuzzles, {
  sceneKey: (schema) => schema.min(1),
});
const puzzleInsert = createInsertSchema(detectiveScenePuzzles, {
  sceneKey: (schema) => schema.min(1),
  width: (schema) => schema.min(1),
  height: (schema) => schema.min(1),
});
const itemSelect = createSelectSchema(detectiveSceneItems, {
  position: (schema) => schema.min(0).max(49),
  title: (schema) => schema.min(1),
});
const itemInsert = createInsertSchema(detectiveSceneItems, {
  title: (schema) => schema.min(1),
  x: (schema) => schema.min(0),
  y: (schema) => schema.min(0),
  width: (schema) => schema.min(1),
  height: (schema) => schema.min(1),
});
const aliasInsert = createInsertSchema(detectiveSceneItemAliases, {
  alias: (schema) => schema.min(1),
});
const foundSelect = createSelectSchema(detectiveSceneAttemptFound, {
  position: (schema) => schema.min(0).max(49),
});

/** A rectangle in scene units. */
export const regionSchema = itemInsert.pick({
  x: true,
  y: true,
  width: true,
  height: true,
});

/** What is typed for a find is capped, so a tap can't carry an essay. */
export const typedTitleSchema = z.string().min(1).max(80);

/** Titles, regions and aliases. Only `check` and the server-side hit-test read them. */
export const solutionSchema = z.object({
  items: z.array(
    z.object({
      ...itemSelect.pick({ position: true, title: true }).shape,
      ...regionSchema.shape,
    }),
  ),
  aliases: z.array(
    z.object({
      position: itemSelect.shape.position,
      alias: aliasInsert.shape.alias,
    }),
  ),
});

/** Strict, so no title, region or alias can ride along. The count is derived from the rows. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({
      puzzleId: true,
      sceneKey: true,
      width: true,
      height: true,
    }).shape,
    itemCount: z.int().min(1).max(50),
  })
  .strict();

/** Every find, as the tap and title that earned it, so `check` re-runs the match. */
export const answerSchema = z.object({
  finds: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        title: typedTitleSchema,
      }),
    )
    .min(1)
    .max(50),
});

export const attemptSchema = z.object({
  found: z
    .array(foundSelect.shape.position)
    .max(50)
    .refine((found) => new Set(found).size === found.length, {
      message: "found items must be distinct",
    }),
});

/** Items are listed in position order: the index is the stored `position`. */
export const contentSchema = z.object({
  ...puzzleInsert.pick({ sceneKey: true, width: true, height: true }).shape,
  items: z
    .array(
      z.object({
        ...itemInsert.pick({ title: true }).shape,
        ...regionSchema.shape,
        aliases: z.array(aliasInsert.shape.alias).default([]),
      }),
    )
    .min(1)
    .max(50),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Region = z.infer<typeof regionSchema>;
