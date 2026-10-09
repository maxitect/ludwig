import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  cctvMazeAttemptSteps,
  cctvMazeAttempts,
  cctvMazeCameras,
  cctvMazePuzzles,
  cctvMazeWalls,
} from "./tables";
import { verifyCctvMaze } from "./verify";

export const cctvMazeModule = {
  schema,
  meta: { key: "cctv-maze" },
  load,
  loadSolution,
  check: (payload, solution, answer) => ({
    correct: check(payload, solution, answer).correct,
  }),
  verify: verifyCctvMaze,
  async upsertContent(tx, puzzleId, { walls, cameras, ...layout }) {
    await tx
      .insert(cctvMazePuzzles)
      .values({ puzzleId, ...layout })
      .onConflictDoUpdate({ target: cctvMazePuzzles.puzzleId, set: layout });
    await tx.delete(cctvMazeWalls).where(eq(cctvMazeWalls.puzzleId, puzzleId));
    if (walls.length) {
      await tx
        .insert(cctvMazeWalls)
        .values(walls.map((wall) => ({ ...wall, puzzleId })));
    }
    await tx
      .delete(cctvMazeCameras)
      .where(eq(cctvMazeCameras.puzzleId, puzzleId));
    if (cameras.length) {
      await tx
        .insert(cctvMazeCameras)
        .values(cameras.map((camera) => ({ ...camera, puzzleId })));
    }
  },
  async replaceAttemptState(tx, attemptId, { path }) {
    await tx
      .delete(cctvMazeAttempts)
      .where(eq(cctvMazeAttempts.attemptId, attemptId));
    await tx.insert(cctvMazeAttempts).values({ attemptId });
    if (path.length) {
      await tx
        .insert(cctvMazeAttemptSteps)
        .values(path.map((cell, step) => ({ ...cell, attemptId, step })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(cctvMazeAttempts)
      .where(eq(cctvMazeAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.cctvMazeAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        steps: {
          columns: { row: true, col: true },
          orderBy: { step: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse({ path: attempt.steps }) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
