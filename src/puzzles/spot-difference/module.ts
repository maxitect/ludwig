import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  spotDifferenceAttemptFound,
  spotDifferenceAttempts,
  spotDifferencePuzzles,
} from "./tables";
import { verifySpotDifference } from "./verify";

export const spotDifferenceModule = {
  schema,
  meta: { key: "spot-difference" },
  load,
  loadSolution,
  check,
  verify: verifySpotDifference,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(spotDifferencePuzzles)
      .values({ ...content, puzzleId })
      .onConflictDoUpdate({
        target: spotDifferencePuzzles.puzzleId,
        set: content,
      });
  },
  async replaceAttemptState(tx, attemptId, { found }) {
    await tx
      .delete(spotDifferenceAttempts)
      .where(eq(spotDifferenceAttempts.attemptId, attemptId));
    await tx.insert(spotDifferenceAttempts).values({ attemptId });
    if (!found.length) return;
    await tx
      .insert(spotDifferenceAttemptFound)
      .values(found.map((differenceIndex) => ({ attemptId, differenceIndex })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(spotDifferenceAttempts)
      .where(eq(spotDifferenceAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.spotDifferenceAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        found: {
          columns: { differenceIndex: true },
          orderBy: { differenceIndex: "asc" },
        },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          found: attempt.found.map(({ differenceIndex }) => differenceIndex),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
