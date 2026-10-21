import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import {
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  words,
  wordWheelPuzzles,
} from "@/db/schema";
import { seedWords } from "../../../scripts/seed-words";
import { readDictionaryFile } from "../word-ladder/dictionary";
import { check } from "./check";
import { deriveWheel, ratingThresholds, validWords } from "./engine";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { wordWheelModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  targetWord: "adventure",
  centrePosition: 2,
  scrambleSeed: 7,
  minLength: 4,
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('ww-test', 'ww', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('word-wheel', 'ww-test', 'ww', 'ww', 'word_wheel_puzzles', 1),
           ('other', 'ww-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  await ensureTypes(tx);
  await tx
    .insert(words)
    .values([{ word: "adventure" }, { word: "venue" }])
    .onConflictDoNothing();
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

describe("word wheel tables", () => {
  it("creates no json or array columns", async () => {
    const rows = await db.execute(sql`
      select table_name from information_schema.columns
      where table_name like 'word_wheel%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(wordWheelPuzzles).values({ ...content, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a word wheel puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "word-wheel");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in word_wheel_puzzles/);
  });

  it("accepts a valid supertype and subtype pair", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-wheel");
        await tx.insert(wordWheelPuzzles).values({ ...content, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a target word that is not in the dictionary", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-wheel");
        await tx
          .insert(wordWheelPuzzles)
          .values({ ...content, targetWord: "zzzzqzzzz", puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a target word that is not nine letters", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-wheel");
        await tx
          .insert(wordWheelPuzzles)
          .values({ ...content, targetWord: "venue", puzzleId });
      }),
    ).toBe("23514");
  });

  it.each([
    ["centre position 9", { centrePosition: 9 }],
    ["negative seed", { scrambleSeed: -1 }],
    ["minimum length 3", { minLength: 3 }],
    ["minimum length 6", { minLength: 6 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-wheel");
        await tx
          .insert(wordWheelPuzzles)
          .values({ ...content, ...override, puzzleId });
      }),
    ).toBe("23514");
  });

  it("accepts a nine-letter word in the dictionary and refuses a ten-letter one", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await tx.insert(words).values({ word: "zzzzzzzzz" });
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        await tx.insert(words).values({ word: "zzzzzzzzzz" });
      }),
    ).toBe("23514");
  });
});

describe("word wheel module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await seedWords(db, readDictionaryFile());
    await db
      .insert(puzzleCategories)
      .values({ key: "ww-test", name: "ww", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "word-wheel",
        categoryKey: "ww-test",
        name: "ww",
        description: "ww",
        subtypeTable: "word_wheel_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "word-wheel",
          slug: "t090-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await wordWheelModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t090mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the wheel and thresholds, and never the target, centre position or word list", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "centre",
      "minLength",
      "rim",
      "thresholds",
    ]);
    expect(JSON.stringify(payload)).not.toContain("adventure");
    expect(payload.centre).toBe("v");
    const wheel = deriveWheel("adventure", 2, 7);
    expect(payload.rim).toEqual(wheel.rim);
    const total = validWords(wheel, 4, readDictionaryFile()).length;
    expect(payload.thresholds).toEqual(ratingThresholds(total));
    expect(total).toBeGreaterThanOrEqual(15);
  });

  it("checks the target word", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(check(payload, solution, { word: "adventure" }).correct).toBe(true);
    expect(check(payload, solution, { word: "venue" }).correct).toBe(false);
  });

  it("replaces, reads back and clears the attempt state, keeping only playable dictionary words", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await wordWheelModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      wordWheelModule.replaceAttemptState(tx, attempt.id, {
        words: ["venue", "dune", "vent", "zzzzv", "venue"],
      }),
    );
    expect(await wordWheelModule.loadAttemptState(attempt.id)).toEqual({
      words: ["vent", "venue"],
    });

    await db.transaction((tx) =>
      wordWheelModule.replaceAttemptState(tx, attempt.id, { words: [] }),
    );
    expect(await wordWheelModule.loadAttemptState(attempt.id)).toEqual({
      words: [],
    });

    await wordWheelModule.clearAttemptState(attempt.id);
    expect(await wordWheelModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
