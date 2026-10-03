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
  anagramAttempts,
  anagramPuzzles,
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { anagramModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  answer: "ink and paper",
  definitionHint: "What the opening titles are made from.",
  scrambleSeed: 1904,
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('an-test', 'an', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('anagram', 'an-test', 'an', 'an', 'anagram_puzzles', 1),
           ('other', 'an-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

describe("anagram_puzzles integrity", () => {
  it("creates no json or array columns", async () => {
    const rows = await db.execute(sql`
      select table_name, data_type from information_schema.columns
      where table_name like 'anagram%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("generates type_key as anagram", async () => {
    const rows = await db.execute(sql`
      select table_name, generation_expression from information_schema.columns
      where table_name in ('anagram_puzzles', 'anagram_attempts')
        and column_name = 'type_key' order by table_name
    `);
    expect(rows.rows).toEqual([
      { table_name: "anagram_attempts", generation_expression: "'anagram'::text" },
      { table_name: "anagram_puzzles", generation_expression: "'anagram'::text" },
    ]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(anagramPuzzles).values({ ...content, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects an anagram puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "anagram");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in anagram_puzzles/);
  });

  it("accepts a valid supertype and subtype pair", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "anagram");
        await tx.insert(anagramPuzzles).values({ ...content, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a negative scramble seed", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "anagram");
        await tx
          .insert(anagramPuzzles)
          .values({ ...content, scrambleSeed: -1, puzzleId });
      }),
    ).toBe("23514");
  });

  it("rejects an anagram attempt of another puzzle type", async () => {
    const userId = await createTestUser("t019tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx
          .insert(anagramAttempts)
          .values({ attemptId: attempt.id, answer: "ink" });
      }),
    ).toBe("23503");
  });
});

describe("anagram module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "an-test", name: "an", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "anagram",
        categoryKey: "an-test",
        name: "an",
        description: "an",
        subtypeTable: "anagram_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "anagram",
          slug: "t019-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await anagramModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t019mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds no answer", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.wordLengths).toEqual([3, 3, 5]);
    expect([...payload.tiles].sort().join("")).toBe(
      [..."inkandpaper"].sort().join(""),
    );
    expect(Object.keys(payload).sort()).toEqual([
      "definitionHint",
      "tiles",
      "wordLengths",
    ]);
    expect(JSON.stringify(payload)).not.toContain("paper");
  });

  it("loads the solution and checks answers against it", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toBe("ink and paper");
    expect(check(payload, solution, { answer: "inkandpaper" }).correct).toBe(
      true,
    );
    expect(check(payload, solution, { answer: "inkandpapre" }).correct).toBe(
      false,
    );
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await anagramModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      anagramModule.replaceAttemptState(tx, attempt.id, { answer: "inka" }),
    );
    await db.transaction((tx) =>
      anagramModule.replaceAttemptState(tx, attempt.id, { answer: "ink" }),
    );
    expect(await anagramModule.loadAttemptState(attempt.id)).toEqual({
      answer: "ink",
    });

    await db.transaction((tx) =>
      anagramModule.replaceAttemptState(tx, attempt.id, { answer: null }),
    );
    expect(await anagramModule.loadAttemptState(attempt.id)).toEqual({
      answer: null,
    });

    await anagramModule.clearAttemptState(attempt.id);
    expect(await anagramModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
