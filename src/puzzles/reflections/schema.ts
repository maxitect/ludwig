import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  reflectionsAttemptMirrors,
  reflectionsFixedMirrors,
  reflectionsPorts,
  reflectionsPuzzles,
  reflectionsSlots,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(9);
const dimension = (schema: z.ZodNumber) => schema.min(4).max(10);
const letter = (schema: z.ZodString) => schema.regex(/^[A-Z]$/);

const puzzleSelect = createSelectSchema(reflectionsPuzzles, {
  rows: dimension,
  cols: dimension,
});
const puzzleInsert = createInsertSchema(reflectionsPuzzles, {
  rows: dimension,
  cols: dimension,
});
const fixedSelect = createSelectSchema(reflectionsFixedMirrors, {
  row: coordinate,
  col: coordinate,
});
const fixedInsert = createInsertSchema(reflectionsFixedMirrors, {
  row: coordinate,
  col: coordinate,
});
const slotSelect = createSelectSchema(reflectionsSlots, {
  row: coordinate,
  col: coordinate,
});
const slotInsert = createInsertSchema(reflectionsSlots, {
  row: coordinate,
  col: coordinate,
});
const portSelect = createSelectSchema(reflectionsPorts, {
  offset: coordinate,
  label: letter,
});
const portInsert = createInsertSchema(reflectionsPorts, {
  offset: coordinate,
  label: letter,
});
const attemptMirrorSelect = createSelectSchema(reflectionsAttemptMirrors, {
  row: coordinate,
  col: coordinate,
});

/** The compass sides a port can sit on: `compass8` narrowed to the four edges. */
export const sideSchema = portSelect.shape.side.extract(["n", "e", "s", "w"]);
export const mirrorSchema = fixedSelect.shape.mirror;

const cell = slotSelect.pick({ row: true, col: true });
const mirror = fixedSelect.pick({ row: true, col: true, mirror: true });
const port = portSelect
  .pick({ offset: true, label: true })
  .extend({ side: sideSchema });
const portRef = port.pick({ side: true, offset: true });

/** Where the player puts mirrors: one `/` or `\` for each slot. The mirrors are not stored. */
export const solutionSchema = z.array(mirror).max(100);

export const payloadSchema = z
  .object({
    rows: puzzleSelect.shape.rows,
    cols: puzzleSelect.shape.cols,
    fixedMirrors: z.array(mirror.strict()),
    slots: z.array(cell.strict()),
    ports: z.array(port.strict()),
  })
  .strict();

export const answerSchema = z.object({ mirrors: z.array(mirror).max(100) });

/** A lettered port whose beam leaves somewhere other than its partner. Computed from the player's answer, never from the solution. */
export const wrongPartSchema = portRef;

export const attemptSchema = z.object({
  mirrors: z.array(attemptMirrorSelect.pick({ row: true, col: true, mirror: true })),
});

/** The written puzzle, with the same limits as the tables. Cells must lie inside the grid. */
export const contentSchema = z
  .object({
    rows: puzzleInsert.shape.rows,
    cols: puzzleInsert.shape.cols,
    fixedMirrors: z.array(fixedInsert.pick({ row: true, col: true, mirror: true })),
    slots: z.array(slotInsert.pick({ row: true, col: true })),
    ports: z.array(
      portInsert
        .pick({ offset: true, label: true })
        .extend({ side: sideSchema }),
    ),
  })
  .superRefine(({ rows, cols, fixedMirrors, slots }, ctx) => {
    const problem = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    fixedMirrors.forEach(({ row, col }, index) => {
      if (row >= rows || col >= cols) {
        problem(["fixedMirrors", index], `mirror does not fit a ${rows} by ${cols} grid`);
      }
    });
    slots.forEach(({ row, col }, index) => {
      if (row >= rows || col >= cols) {
        problem(["slots", index], `slot does not fit a ${rows} by ${cols} grid`);
      }
    });
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Mirror = z.infer<typeof mirrorSchema>;
export type Side = z.infer<typeof sideSchema>;
export type Cell = z.infer<typeof cell>;
export type Placed = z.infer<typeof mirror>;
export type Port = z.infer<typeof port>;
export type PortRef = z.infer<typeof portRef>;
