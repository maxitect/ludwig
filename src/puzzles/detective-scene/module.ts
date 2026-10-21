import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  detectiveSceneAttemptFound,
  detectiveSceneAttempts,
  detectiveSceneItemAliases,
  detectiveSceneItems,
  detectiveScenePuzzles,
} from "./tables";
import { verifyDetectiveScene } from "./verify";

export const detectiveSceneModule = {
  schema,
  meta: { key: "detective-scene" },
  load,
  loadSolution,
  check,
  verify: verifyDetectiveScene,
  async upsertContent(tx, puzzleId, { sceneKey, width, height, items }) {
    await tx
      .insert(detectiveScenePuzzles)
      .values({ puzzleId, sceneKey, width, height })
      .onConflictDoUpdate({
        target: detectiveScenePuzzles.puzzleId,
        set: { sceneKey, width, height },
      });
    await tx.delete(detectiveSceneItems).where(
      and(
        eq(detectiveSceneItems.puzzleId, puzzleId),
        notInArray(
          detectiveSceneItems.position,
          items.map((_, position) => position),
        ),
      ),
    );
    await tx
      .insert(detectiveSceneItems)
      .values(
        items.map(({ title, x, y, width, height }, position) => ({
          puzzleId,
          position,
          title,
          x,
          y,
          width,
          height,
        })),
      )
      .onConflictDoUpdate({
        target: [detectiveSceneItems.puzzleId, detectiveSceneItems.position],
        set: {
          title: sql`excluded.title`,
          x: sql`excluded.x`,
          y: sql`excluded.y`,
          width: sql`excluded.width`,
          height: sql`excluded.height`,
        },
      });
    for (const [position, { aliases }] of items.entries()) {
      await tx.delete(detectiveSceneItemAliases).where(
        and(
          eq(detectiveSceneItemAliases.puzzleId, puzzleId),
          eq(detectiveSceneItemAliases.position, position),
          aliases.length
            ? notInArray(detectiveSceneItemAliases.alias, aliases)
            : undefined,
        ),
      );
      if (!aliases.length) continue;
      await tx
        .insert(detectiveSceneItemAliases)
        .values(aliases.map((alias) => ({ puzzleId, position, alias })))
        .onConflictDoNothing();
    }
  },
  async replaceAttemptState(tx, attemptId, { found }) {
    await tx
      .delete(detectiveSceneAttempts)
      .where(eq(detectiveSceneAttempts.attemptId, attemptId));
    await tx.insert(detectiveSceneAttempts).values({ attemptId });
    if (!found.length) return;
    await tx
      .insert(detectiveSceneAttemptFound)
      .values(found.map((position) => ({ attemptId, position })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(detectiveSceneAttempts)
      .where(eq(detectiveSceneAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.detectiveSceneAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        found: { columns: { position: true }, orderBy: { position: "asc" } },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          found: attempt.found.map(({ position }) => position),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
