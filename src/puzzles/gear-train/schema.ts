import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  gearTrainAttemptCogs,
  gearTrainBolts,
  gearTrainFixedCogs,
  gearTrainInventory,
  gearTrainPuzzles,
  gearTrainSolutionCogs,
} from "./tables";

const teeth = z.union([z.literal(8), z.literal(16), z.literal(24)]);
const size = (schema: z.ZodNumber) => schema.min(4).max(12);
const count = (schema: z.ZodNumber) => schema.min(1).max(6);

const puzzleSelect = createSelectSchema(gearTrainPuzzles, {
  rows: size,
  cols: size,
});
const puzzleInsert = createInsertSchema(gearTrainPuzzles, {
  rows: size,
  cols: size,
});
const fixedSelect = createSelectSchema(gearTrainFixedCogs, { teeth });
const boltSelect = createSelectSchema(gearTrainBolts);
const inventorySelect = createSelectSchema(gearTrainInventory, {
  teeth,
  count,
});
const solutionSelect = createSelectSchema(gearTrainSolutionCogs, { teeth });
const attemptCogSelect = createSelectSchema(gearTrainAttemptCogs, { teeth });

const cog = fixedSelect.pick({ row: true, col: true, teeth: true });
const bolt = boltSelect.pick({ row: true, col: true });
const inventory = inventorySelect.pick({ teeth: true, count: true });
const placedCog = solutionSelect.pick({ row: true, col: true, teeth: true });
const attemptCog = attemptCogSelect.pick({ row: true, col: true, teeth: true });

export const solutionSchema = z.object({ cogs: z.array(placedCog) });

/** Strict, so a solution cog is rejected. The driver always turns clockwise. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ rows: true, cols: true, targetClockwise: true })
      .shape,
    driver: cog.strict(),
    target: cog.strict(),
    bolts: z.array(bolt.strict()),
    inventory: z.array(inventory.strict()),
  })
  .strict();

export const answerSchema = z.object({ cogs: z.array(attemptCog) });

export const attemptSchema = z.object({ cogs: z.array(attemptCog) });

export const contentSchema = z.object({
  ...puzzleInsert.pick({ rows: true, cols: true, targetClockwise: true }).shape,
  driver: cog,
  target: cog,
  bolts: z.array(bolt),
  inventory: z.array(inventory).min(1),
  solution: z.array(placedCog),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Cog = Payload["driver"];
