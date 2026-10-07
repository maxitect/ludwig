import { eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { rolledBack } from "@/db/integrity/harness";
import { pictogramGlyphs } from "@/db/schema";
import { pictogramGlyphs as lookups } from "../content/lookups";
import { seedPictogramGlyphs } from "./seed-pictogram-glyphs";

beforeAll(async () => {
  await seedPictogramGlyphs(db, lookups);
});

describe("seedPictogramGlyphs", () => {
  it("is a no-op on a second run and keeps every id", async () => {
    const before = await db
      .select()
      .from(pictogramGlyphs)
      .orderBy(pictogramGlyphs.id);
    const summary = await seedPictogramGlyphs(db, lookups);
    expect(summary).toEqual({ inserted: 0, updated: 26, removed: 0 });
    expect(
      await db.select().from(pictogramGlyphs).orderBy(pictogramGlyphs.id),
    ).toEqual(before);
  });

  it("restores a changed asset key on the same id", async () => {
    const [row] = await rolledBack(async (tx) => {
      await tx.execute(
        sql`update pictogram_glyphs set asset_key = 'glyph-98' where id = 26`,
      );
      await seedPictogramGlyphs(tx, lookups);
      return tx
        .select()
        .from(pictogramGlyphs)
        .where(eq(pictogramGlyphs.id, 26));
    });
    expect(row).toEqual({
      id: 26,
      assetKey: "glyph-26",
      letter: lookups[25].letter,
    });
  });

  it("never removes a glyph the input leaves out", async () => {
    const count = await rolledBack(async (tx) => {
      await seedPictogramGlyphs(tx, lookups.slice(0, 3));
      const { rows } = await tx.execute<{ n: number }>(
        sql`select count(*)::int as n from pictogram_glyphs`,
      );
      return rows[0].n;
    });
    expect(count).toBe(26);
  });
});
