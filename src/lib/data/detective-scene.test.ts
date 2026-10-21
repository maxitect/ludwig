import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attempts,
  detectiveSceneAttemptFound,
  detectiveSceneAttempts,
  detectiveSceneItems,
  detectiveScenePuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { getFoundItems } from "./detective-scene";

const suffix = `${Date.now()}`;
let puzzleId: string;
let userId: string;
let createdType = false;

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: `ds-data-${suffix}`, name: "ds", sort: 99 })
    .onConflictDoNothing();
  createdType =
    (
      await db
        .insert(puzzleTypes)
        .values({
          key: "detective-scene",
          categoryKey: `ds-data-${suffix}`,
          name: "ds",
          description: "ds",
          subtypeTable: "detective_scene_puzzles",
          sort: 99,
        })
        .onConflictDoNothing()
        .returning({ key: puzzleTypes.key })
    ).length > 0;
  puzzleId = await db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(puzzles)
      .values({
        typeKey: "detective-scene",
        slug: `ds-data-${suffix}`,
        title: "ds",
        difficulty: 1,
        publishedAt: new Date("2026-01-01T00:00:00Z"),
      })
      .returning({ id: puzzles.id });
    await tx
      .insert(detectiveScenePuzzles)
      .values({ puzzleId: id, sceneKey: `ds-data-${suffix}`, width: 100, height: 80 });
    await tx.insert(detectiveSceneItems).values([
      { puzzleId: id, position: 0, title: "The Sweeney", x: 0, y: 0, width: 20, height: 10 },
      { puzzleId: id, position: 1, title: "Morse", x: 50, y: 50, width: 20, height: 10 },
    ]);
    return id;
  });
  userId = await createTestUser("t091-data");
  const [attempt] = await db
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await db.insert(detectiveSceneAttempts).values({ attemptId: attempt.id });
  await db
    .insert(detectiveSceneAttemptFound)
    .values({ attemptId: attempt.id, position: 0 });
});

afterAll(async () => {
  await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
  await deleteTestUsers();
  if (createdType) {
    await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "detective-scene"));
  }
  await db
    .delete(puzzleCategories)
    .where(eq(puzzleCategories.key, `ds-data-${suffix}`));
});

describe("getFoundItems", () => {
  it("returns only the saved finds to a signed-in player, whatever is asked for", async () => {
    const items = await getFoundItems(userId, puzzleId, [0, 1]);
    expect(items?.map(({ position }) => position)).toEqual([0]);
  });

  it("returns nothing to a signed-in player with no saved finds", async () => {
    const other = await createTestUser("t091-data");
    expect(await getFoundItems(other, puzzleId, [0, 1])).toEqual([]);
  });

  it("returns the asked-for items to a signed-out player", async () => {
    const items = await getFoundItems(null, puzzleId, [1]);
    expect(items).toEqual([
      {
        position: 1,
        title: "Morse",
        region: { x: 50, y: 50, width: 20, height: 10 },
      },
    ]);
  });
});
