import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  cctvMazeAttemptSteps,
  cctvMazeCameras,
  cctvMazePuzzles,
  cctvMazeWalls,
} from "./tables";

const MAX_PATH = 450;

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(14);
const dimension = (schema: z.ZodNumber) => schema.min(3).max(15);
const fovDeg = (schema: z.ZodNumber) => schema.min(1).max(360);
const rangeCells = (schema: z.ZodNumber) => schema.min(1).max(30);

const layoutOverrides = {
  rows: dimension,
  cols: dimension,
  startRow: coordinate,
  startCol: coordinate,
  exitRow: coordinate,
  exitCol: coordinate,
};

const puzzleSelect = createSelectSchema(cctvMazePuzzles, layoutOverrides);
const puzzleInsert = createInsertSchema(cctvMazePuzzles, layoutOverrides);
const wallSelect = createSelectSchema(cctvMazeWalls, {
  row: coordinate,
  col: coordinate,
});
const wallInsert = createInsertSchema(cctvMazeWalls, {
  row: coordinate,
  col: coordinate,
});
const cameraSelect = createSelectSchema(cctvMazeCameras, {
  row: coordinate,
  col: coordinate,
  fovDeg,
  rangeCells,
});
const cameraInsert = createInsertSchema(cctvMazeCameras, {
  row: coordinate,
  col: coordinate,
  fovDeg,
  rangeCells,
});
const stepSelect = createSelectSchema(cctvMazeAttemptSteps, {
  row: coordinate,
  col: coordinate,
});

const cell = stepSelect.pick({ row: true, col: true });

/** The layout only: the seen cells and the path are derived from it and never sent. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({
      puzzleId: true,
      rows: true,
      cols: true,
      startRow: true,
      startCol: true,
      exitRow: true,
      exitCol: true,
    }).shape,
    walls: z.array(
      wallSelect.pick({ row: true, col: true, side: true }).strict(),
    ),
    cameras: z.array(
      cameraSelect
        .pick({ row: true, col: true, facing: true, fovDeg: true, rangeCells: true })
        .strict(),
    ),
  })
  .strict();

/** The cells some camera can see, derived from the layout. */
export const solutionSchema = z.object({ seen: z.array(cell) });

export const answerSchema = z.object({
  path: z.array(cell).min(2).max(MAX_PATH),
});

/** The path so far, from the start cell. */
export const attemptSchema = z.object({
  path: z.array(cell).max(MAX_PATH),
});

export const contentSchema = puzzleInsert
  .pick({
    rows: true,
    cols: true,
    startRow: true,
    startCol: true,
    exitRow: true,
    exitCol: true,
  })
  .extend({
    walls: z.array(wallInsert.pick({ row: true, col: true, side: true })),
    cameras: z.array(
      cameraInsert.pick({
        row: true,
        col: true,
        facing: true,
        fovDeg: true,
        rangeCells: true,
      }),
    ),
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
