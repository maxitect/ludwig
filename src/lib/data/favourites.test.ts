import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import {
  puzzles,
  troixPuzzles,
  userFavouriteTypes,
  userTypeVisits,
} from "@/db/schema";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import { registry } from "@/puzzles/registry";
import { seed } from "../../../scripts/seed";
import { getFavouriteShelf } from "./favourites";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/user", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
}));

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const slug = "zz-favourites-fixture";
let userId: string;
const contentDir = mkdtempSync(path.join(tmpdir(), "ludwig-empty-content-"));

beforeAll(async () => {
  await seed({ db, registry, contentDir });
  userId = await createTestUser("shelf");
  await db.transaction(async (tx) => {
    const [puzzle] = await tx
      .insert(puzzles)
      .values({
        typeKey: "troix",
        slug,
        title: "ZZ Fixture",
        difficulty: 1,
        publishedAt: daysAgo(1),
      })
      .returning({ id: puzzles.id });
    await tx.insert(troixPuzzles).values({ puzzleId: puzzle.id, size: 6 });
  });
  await db.insert(userFavouriteTypes).values({ userId, typeKey: "troix" });
});
afterAll(async () => {
  await db.delete(puzzles).where(eq(puzzles.slug, slug));
  await deleteTestUsers();
  rmSync(contentDir, { recursive: true, force: true });
});

describe("getFavouriteShelf", () => {
  const find = async () =>
    (await getFavouriteShelf(userId)).find(({ key }) => key === "troix");

  it("shows the newest published puzzle", async () => {
    expect((await find())?.newest?.title).toBe("ZZ Fixture");
  });

  it("counts puzzles published since the last visit", async () => {
    await db
      .insert(userTypeVisits)
      .values({ userId, typeKey: "troix", visitedAt: daysAgo(2) });
    expect((await find())?.fresh).toBe(1);

    await db
      .update(userTypeVisits)
      .set({ visitedAt: new Date() })
      .where(eq(userTypeVisits.userId, userId));
    expect((await find())?.fresh).toBe(0);
  });
});
