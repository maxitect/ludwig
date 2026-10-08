/**
 * Seeds the `words` dictionary from content/words.txt.
 *
 * Source: SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, as packaged in the npm
 * package `wordlist-english` 1.2.1. The `english` and `british` lists at levels 10, 20, 35, 40, 50
 * and 55, keeping only all-lowercase a to z words of 3 to 6 letters, which drops every proper
 * noun, abbreviation with punctuation and hyphenated or accented form.
 *
 * Licence: the word lists are under SCOWL's own notices (the package's MIT licence covers only its
 * JavaScript). Copyright 2000-2016 by Kevin Atkinson, with permission to use, copy, modify,
 * distribute and sell them for any purpose, provided the copyright and permission notices appear
 * in supporting documentation. The British list comes from VarCon, which also carries notices
 * from Benjamin Titze and Geoff Kuenning (Ispell). SCOWL's full Copyright file, with every notice,
 * is reproduced verbatim in content/words.COPYRIGHT, which must travel with content/words.txt.
 */
import type { db as appDb } from "../src/db";
import { wordPattern } from "../src/puzzles/word-ladder/schema";
import { words } from "../src/puzzles/word-ladder/tables";

type Db = Pick<typeof appDb, "insert">;

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
    const rows = await db
      .insert(words)
      .values(unique.slice(i, i + BATCH_SIZE).map((word) => ({ word })))
      .onConflictDoNothing()
      .returning({ word: words.word });
    inserted += rows.length;
  }
  return { inserted, total: unique.length, failures: [] as string[] };
}
