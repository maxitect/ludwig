import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pictogramGlyphs as lookupGlyphs } from "../../../content/lookups";
import { seedPictogramGlyphs } from "../../../scripts/seed-pictogram-glyphs";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import {
  attempts,
  pictogramCipherAttemptGuesses,
  pictogramCipherAttempts,
  pictogramCipherGivenGlyphs,
  pictogramCipherPuzzles,
  pictogramCipherSymbols,
  pictogramGlyphs,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { pictogramCipherModule } from "./module";
import { payloadSchema } from "./schema";

const letterOf = Object.fromEntries(
  lookupGlyphs.map(({ assetKey, letter }) => [assetKey, letter]),
);
const keyOf = Object.fromEntries(
  lookupGlyphs.map(({ assetKey, letter }) => [letter, assetKey]),
);

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('pc-test', 'pc', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('pictogram-cipher', 'pc-test', 'pc', 'pc', 'pictogram_cipher_puzzles', 1)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, slug = "one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey: "pictogram-cipher", slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  await tx.insert(pictogramCipherPuzzles).values({ puzzleId: row.id });
  return row.id;
}

beforeAll(async () => {
  await seedPictogramGlyphs(db, lookupGlyphs);
});

describe("pictogram_glyphs", () => {
  it("holds 26 glyphs with unique asset keys and letters", async () => {
    const { rows } = await db.execute(
      sql`select count(*)::int as n, count(distinct letter)::int as letters, count(distinct asset_key)::int as keys from pictogram_glyphs`,
    );
    expect(rows[0]).toEqual({ n: 26, letters: 26, keys: 26 });
  });

  it("rejects a second glyph for a letter that has one", async () => {
    expect(
      await pgErrorCode((tx) =>
        tx.insert(pictogramGlyphs).values({
          id: 99,
          assetKey: "glyph-99",
          letter: letterOf["glyph-01"],
        }),
      ),
    ).toBe("23505");
  });

  it("rejects a second glyph for an asset key that is taken", async () => {
    expect(
      await pgErrorCode((tx) =>
        tx
          .insert(pictogramGlyphs)
          .values({ id: 99, assetKey: "glyph-01", letter: "z" }),
      ),
    ).toBe("23505");
  });

  it.each(["e", "glyph-e", "glyph-1", "eye"])(
    "rejects the asset key %s, which is not a neutral number",
    async (assetKey) => {
      expect(
        await pgErrorCode((tx) =>
          tx.insert(pictogramGlyphs).values({ id: 99, assetKey, letter: "q" }),
        ),
      ).toBe("23514");
    },
  );

  it("never names an asset after its letter", () => {
    for (const { assetKey, letter } of lookupGlyphs) {
      expect(assetKey).not.toContain(letter.toUpperCase());
      expect(assetKey.replace("glyph-", "")).toMatch(/^\d{2}$/);
    }
  });
});

describe("pictogram cipher integrity", () => {
  it("stores no plaintext, json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'pictogram%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
             or column_name in ('plaintext', 'word', 'words', 'message', 'answer'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a symbol for a glyph that does not exist", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx);
        await tx
          .insert(pictogramCipherSymbols)
          .values({ puzzleId, wordIndex: 0, position: 0, glyphId: 99 });
      }),
    ).toBe("23503");
  });

  it("rejects a given glyph that does not exist", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx);
        await tx.insert(pictogramCipherGivenGlyphs).values({ puzzleId, glyphId: 99 });
      }),
    ).toBe("23503");
  });

  it("rejects a negative position", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx);
        await tx
          .insert(pictogramCipherSymbols)
          .values({ puzzleId, wordIndex: 0, position: -1, glyphId: 1 });
      }),
    ).toBe("23514");
  });

  it("rejects the same symbol position twice", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx);
        const symbol = { puzzleId, wordIndex: 0, position: 0, glyphId: 1 };
        await tx.insert(pictogramCipherSymbols).values([symbol, symbol]);
      }),
    ).toBe("23505");
  });

  describe("guesses", () => {
    let userId: string;
    beforeAll(async () => {
      userId = await createTestUser("t054guess");
    });
    afterAll(deleteTestUsers);

    const insertGuess = (glyphId: number, letter: string) =>
      pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx);
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx
          .insert(pictogramCipherAttempts)
          .values({ attemptId: attempt.id });
        await tx
          .insert(pictogramCipherAttemptGuesses)
          .values({ attemptId: attempt.id, glyphId, letter });
      });

    it("rejects a guess for a glyph that does not exist", async () => {
      expect(await insertGuess(99, "a")).toBe("23503");
    });

    it("rejects a guess that is not a lowercase letter", async () => {
      expect(await insertGuess(1, "A")).toBe("23514");
    });

    it("accepts a guess for a real glyph", async () => {
      expect(await insertGuess(1, "a")).toBeUndefined();
    });
  });
});

describe("pictogram cipher module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const content = {
    plaintext: "he sees the whole thing",
    given: ["e", "h", "s"],
  };

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "pc-test", name: "pc", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "pictogram-cipher",
        categoryKey: "pc-test",
        name: "pc",
        description: "pc",
        subtypeTable: "pictogram_cipher_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "pictogram-cipher",
          slug: "t054-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await pictogramCipherModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t054pcmod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads glyph keys and the given letters only, never the mapping", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual(["given", "words"]);
    expect(payload.words.map((word) => word.length)).toEqual([2, 4, 3, 5, 5]);
    expect(payload.given.sort((a, b) => a.letter.localeCompare(b.letter))).toEqual(
      ["e", "h", "s"].map((letter) => ({ assetKey: keyOf[letter], letter })),
    );

    const json = JSON.stringify(payload);
    const givenKeys = new Set(payload.given.map(({ assetKey }) => assetKey));
    for (const { assetKey, letter } of lookupGlyphs) {
      if (givenKeys.has(assetKey)) continue;
      expect(json).not.toContain(`"${assetKey}","letter"`);
      expect(json).not.toContain(`"assetKey":"${assetKey}","letter":"${letter}"`);
    }
    expect(json).not.toContain("whole");
    expect(Object.keys(payload.words.flat())).not.toContain("letter");
  });

  it("derives the plaintext from the symbols and the glyph letters", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution.words.map((word) => word.join(""))).toEqual([
      "he",
      "sees",
      "the",
      "whole",
      "thing",
    ]);
    const payload = await load(puzzleId);
    expect(
      check(payload, solution, { answer: "He sees the whole thing" }).correct,
    ).toBe(true);
    expect(
      check(payload, solution, { answer: "he sees the whole thin" }).correct,
    ).toBe(false);
  });

  it("updates in place, dropping symbols and given glyphs the content no longer has", async () => {
    await db.transaction((tx) =>
      pictogramCipherModule.upsertContent(tx, puzzleId, {
        plaintext: "he sees",
        given: ["e"],
      }),
    );
    expect((await loadSolution(puzzleId)).words).toEqual([
      ["h", "e"],
      ["s", "e", "e", "s"],
    ]);
    expect((await load(puzzleId)).given).toEqual([
      { assetKey: keyOf.e, letter: "e" },
    ]);
    await db.transaction((tx) =>
      pictogramCipherModule.upsertContent(tx, puzzleId, content),
    );
    expect((await loadSolution(puzzleId)).words).toHaveLength(5);
  });

  it("rejects removing a glyph a puzzle uses, naming the foreign key", async () => {
    const error = await pgError((tx) =>
      tx.delete(pictogramGlyphs).where(eq(pictogramGlyphs.assetKey, keyOf.e)),
    );
    expect(error?.code).toBe("23503");
    expect(error?.message).toContain("pictogram_cipher_");
    expect(error?.message).toContain("_glyph_id_fk");
  });

  it("fails the content when a letter has no glyph", async () => {
    await expect(
      db.transaction((tx) =>
        pictogramCipherModule.upsertContent(tx, puzzleId, {
          plaintext: "he sees é",
          given: ["e"],
        }),
      ),
    ).rejects.toThrow("Unknown glyph letter");
    expect((await loadSolution(puzzleId)).words).toHaveLength(5);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await pictogramCipherModule.loadAttemptState(attempt.id)).toBeNull();

    const guesses = (letters: string[]) =>
      letters.map((letter) => ({ assetKey: keyOf[letter], letter }));
    await db.transaction((tx) =>
      pictogramCipherModule.replaceAttemptState(tx, attempt.id, {
        guesses: guesses(["t"]),
      }),
    );
    await db.transaction((tx) =>
      pictogramCipherModule.replaceAttemptState(tx, attempt.id, {
        guesses: guesses(["w", "o", "l"]),
      }),
    );
    const saved = await pictogramCipherModule.loadAttemptState(attempt.id);
    expect(saved?.guesses).toHaveLength(3);
    expect(saved?.guesses).toEqual(
      expect.arrayContaining(guesses(["w", "o", "l"])),
    );
    const rows = await db
      .select()
      .from(pictogramCipherAttemptGuesses)
      .where(eq(pictogramCipherAttemptGuesses.attemptId, attempt.id));
    expect(rows).toHaveLength(3);

    await db.transaction((tx) =>
      pictogramCipherModule.replaceAttemptState(tx, attempt.id, { guesses: [] }),
    );
    expect(await pictogramCipherModule.loadAttemptState(attempt.id)).toEqual({
      guesses: [],
    });
    await pictogramCipherModule.clearAttemptState(attempt.id);
    expect(await pictogramCipherModule.loadAttemptState(attempt.id)).toBeNull();
    await db.delete(attempts).where(eq(attempts.id, attempt.id));
  });

  it("rejects saved guesses for a glyph that does not exist", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    await expect(
      db.transaction((tx) =>
        pictogramCipherModule.replaceAttemptState(tx, attempt.id, {
          guesses: [{ assetKey: "glyph-99", letter: "a" }],
        }),
      ),
    ).rejects.toThrow("Unknown glyph assetKey");
  });
});
