/**
 * Seeds the `words` dictionary from content/words.txt.
 *
 * Source: SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, as packaged in the npm
 * package `wordlist-english` 1.2.1 (MIT). The `english` and `british` lists at frequency levels
 * 10, 20, 35, 40, 50 and 55, keeping only all-lowercase a to z words of 3 to 6 letters, which
 * drops every proper noun, abbreviation with punctuation and hyphenated or accented form.
 *
 * Licence: SCOWL's permissive notice. Copyright 2000-2016 by Kevin Atkinson. Permission to use,
 * copy, modify, distribute and sell these word lists, the associated scripts, the output created
 * from the scripts, and its documentation for any purpose is hereby granted without fee, provided
 * that the above copyright notice appears in all copies and that both that copyright notice and
 * this permission notice appear in supporting documentation. The lists are provided "as is". The
 * lowest levels derive from Moby Words II, which is in the public domain.
 */
import { inArray } from "drizzle-orm";
import type { db as appDb } from "../src/db";
import { wordPattern } from "../src/puzzles/word-ladder/dictionary";
import { words } from "../src/puzzles/word-ladder/tables";

type Db = Pick<typeof appDb, "insert" | "select">;

const BATCH_SIZE = 5000;

/**
 * Inserts the words the table is missing, one `INSERT ... ON CONFLICT DO NOTHING` per batch.
 * Words are never removed: puzzles and the reference ladders point at them.
 */
export async function seedWords(db: Db, lines: string[]) {
  const invalid = lines.filter((line) => !wordPattern.test(line));
  if (invalid.length) {
    return {
      inserted: 0,
      total: 0,
      failures: [
        `words: ${invalid.length} invalid lines, first "${invalid[0]}" (3 to 6 lowercase letters only)`,
      ],
    };
  }
  const unique = [...new Set(lines)];
  let inserted = 0;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const present = await db
      .select({ word: words.word })
      .from(words)
      .where(inArray(words.word, batch));
    const have = new Set(present.map(({ word }) => word));
    const missing = batch.filter((word) => !have.has(word));
    if (!missing.length) continue;
    const rows = await db
      .insert(words)
      .values(missing.map((word) => ({ word })))
      .onConflictDoNothing()
      .returning({ word: words.word });
    inserted += rows.length;
  }
  return { inserted, total: unique.length, failures: [] as string[] };
}
