import { sql } from "drizzle-orm";
import type { db as appDb } from "../src/db";
import { pictogramGlyphs } from "../src/db/schema";

type Db = Pick<typeof appDb, "insert">;

/** Upserts the glyph alphabet by id. Glyphs are never removed: puzzles and saved guesses point at them. */
export async function seedPictogramGlyphs(
  db: Db,
  glyphs: (typeof pictogramGlyphs.$inferInsert)[],
) {
  const rows = await db
    .insert(pictogramGlyphs)
    .values(glyphs)
    .onConflictDoUpdate({
      target: pictogramGlyphs.id,
      set: {
        assetKey: sql`excluded.asset_key`,
        letter: sql`excluded.letter`,
      },
    })
    .returning({ inserted: sql<boolean>`(xmax = 0)` });
  const inserted = rows.filter((row) => row.inserted).length;
  return { inserted, updated: rows.length - inserted, removed: 0 };
}
