import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  logicGridAttemptMarks,
  logicGridAttemptStruckClues,
  logicGridAttempts,
  logicGridCategories,
  logicGridClues,
  logicGridItems,
  logicGridSolutionLinks,
} from "./tables";

const categorySelect = createSelectSchema(logicGridCategories);
const categoryInsert = createInsertSchema(logicGridCategories);
const itemSelect = createSelectSchema(logicGridItems);
const itemInsert = createInsertSchema(logicGridItems);
const clueSelect = createSelectSchema(logicGridClues);
const clueInsert = createInsertSchema(logicGridClues);
const linkSelect = createSelectSchema(logicGridSolutionLinks);
const attemptSelect = createSelectSchema(logicGridAttempts);
const markSelect = createSelectSchema(logicGridAttemptMarks);
const struckSelect = createSelectSchema(logicGridAttemptStruckClues);

const link = linkSelect.pick({ itemAId: true, itemBId: true });

export const solutionSchema = z.object({
  links: z.array(link),
  clues: z.array(clueSelect.pick({ position: true, isFalse: true })),
});

/** Strict, so a clue that carries `isFalse` is rejected. `variant` is derived from the solution and says only that one clue is false. */
export const payloadSchema = z
  .object({
    variant: z.boolean(),
    categories: z.array(
      z
        .object({
          ...categorySelect.pick({ position: true, name: true }).shape,
          items: z.array(
            itemSelect.pick({ id: true, position: true, label: true }).strict(),
          ),
        })
        .strict(),
    ),
    clues: z.array(
      clueSelect.pick({ position: true, content: true }).strict(),
    ),
  })
  .strict();

/** Every linked pair across every pair of categories, with the clue the player flags as false in the variant. */
export const answerSchema = z.object({
  links: z.array(link),
  falseCluePosition: attemptSelect.shape.falseCluePosition.optional(),
});

export const attemptSchema = z.object({
  marks: z.array(markSelect.pick({ itemAId: true, itemBId: true, mark: true })),
  struckClues: z.array(struckSelect.pick({ cluePosition: true })),
  falseCluePosition: attemptSelect.shape.falseCluePosition,
});

/**
 * How a clue reads on the grid. Authoring metadata for `puzzles:verify`, not stored: items are named by label.
 * `either` links `a` to `b` or `c`, which share a category.
 */
export const ruleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("is"), a: z.string(), b: z.string() }),
  z.object({ kind: z.literal("isNot"), a: z.string(), b: z.string() }),
  z.object({
    kind: z.literal("either"),
    a: z.string(),
    b: z.string(),
    c: z.string(),
  }),
]);

/** `solution` has one row per household of linked items, one label per category in category order. */
export const contentSchema = z.object({
  categories: z
    .array(
      z.object({
        name: categoryInsert.shape.name,
        items: z.array(itemInsert.shape.label).min(3).max(6),
      }),
    )
    .min(3)
    .max(6),
  solution: z.array(z.array(itemInsert.shape.label)).min(3).max(6),
  clues: z
    .array(
      z.object({
        content: clueInsert.shape.content,
        isFalse: clueInsert.shape.isFalse,
        rule: ruleSchema,
      }),
    )
    .min(1),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Rule = z.infer<typeof ruleSchema>;
