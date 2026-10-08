import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  rolledBack,
  type Tx,
} from "@/db/integrity/harness";
import {
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  wordSearchAttemptFound,
  wordSearchAttempts,
  wordSearchCells,
  wordSearchPuzzles,
  wordSearchWords,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { wordSearchModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  grid: ["CATZ", "ZZZD", "ZZZO", "ZZZG"],
  words: ["CAT", "DOG"],
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('ws-test', 'ws', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('word-search', 'ws-test', 'ws', 'ws', 'word_search_puzzles', 1),
           ('other', 'ws-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertAttempt(tx: Tx, userId: string, puzzleId: string) {
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  return attempt.id;
}

describe("word search tables", () => {
  it("creates no json, array or placement columns", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'word_search%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(start|end|direction|placement)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("keys the cells on (puzzle_id, row, col)", async () => {
    const rows = await db.execute(sql`
      select a.attname from pg_index i
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = 'word_search_cells'::regclass and i.indisprimary
      order by array_position(i.indkey::int2[], a.attnum)
    `);
    expect(rows.rows.map((row) => row.attname)).toEqual(["puzzle_id", "row", "col"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
      }),
    ).toBe("23503");
  });

  it("rejects a word search puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "word-search");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in word_search_puzzles/);
  });

  it("accepts a valid supertype, subtype, cell and word", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-search");
        await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
        await tx
          .insert(wordSearchCells)
          .values({ puzzleId, row: 0, col: 0, letter: "C" });
        await tx.insert(wordSearchWords).values({ puzzleId, word: "CAT" });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["a lower-case letter", { letter: "c" }],
    ["a digit", { letter: "7" }],
    ["a negative row", { row: -1 }],
    ["a negative column", { col: -1 }],
  ])("rejects a cell with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-search");
        await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
        await tx
          .insert(wordSearchCells)
          .values({ puzzleId, row: 0, col: 0, letter: "C", ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a duplicate cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-search");
        await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
        const cell = { puzzleId, row: 0, col: 0, letter: "C" };
        await tx.insert(wordSearchCells).values([cell, cell]);
      }),
    ).toBe("23505");
  });

  it.each(["cat", "AT", "CA-T", "ABCDEFGHIJKLMNOP"])(
    "rejects the word %s",
    async (word) => {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertPuzzle(tx, "word-search");
          await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
          await tx.insert(wordSearchWords).values({ puzzleId, word });
        }),
      ).toBe("23514");
    },
  );

  it.each([2, 16])("rejects a grid of %i rows", async (rows) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-search");
        await tx.insert(wordSearchPuzzles).values({ puzzleId, rows, cols: 4 });
      }),
    ).toBe("23514");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t051tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const attemptId = await insertAttempt(tx, userId, puzzleId);
        await tx.insert(wordSearchAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });

  it("fills the puzzle id of an attempt and its found words from the attempt", async () => {
    const userId = await createTestUser("t051fill");
    const { puzzleId, found } = await rolledBack(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "word-search");
      await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
      await tx.insert(wordSearchWords).values({ puzzleId, word: "CAT" });
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(wordSearchAttempts).values({ attemptId });
      await tx.insert(wordSearchAttemptFound).values({ attemptId, word: "CAT" });
      await forceDeferred(tx);
      const [attempt] = await tx.select().from(wordSearchAttempts);
      const [found] = await tx.select().from(wordSearchAttemptFound);
      expect(attempt.puzzleId).toBe(puzzleId);
      return { puzzleId, found };
    });
    expect(found.puzzleId).toBe(puzzleId);
  });

  it("rejects a found word that is not one of the puzzle's words, at commit", async () => {
    const userId = await createTestUser("t051other");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "word-search");
      await tx.insert(wordSearchPuzzles).values({ puzzleId, rows: 4, cols: 4 });
      await tx.insert(wordSearchWords).values({ puzzleId, word: "CAT" });
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(wordSearchAttempts).values({ attemptId });
      await tx.insert(wordSearchAttemptFound).values({ attemptId, word: "DOG" });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });

  it("rejects a found word of another puzzle's list", async () => {
    const userId = await createTestUser("t051cross");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "word-search");
      const otherId = await insertPuzzle(tx, "word-search", "two");
      await tx.insert(wordSearchPuzzles).values([
        { puzzleId, rows: 4, cols: 4 },
        { puzzleId: otherId, rows: 4, cols: 4 },
      ]);
      await tx.insert(wordSearchWords).values({ puzzleId: otherId, word: "DOG" });
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(wordSearchAttempts).values({ attemptId });
      await tx.insert(wordSearchAttemptFound).values({ attemptId, word: "DOG" });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });
});

describe("word search module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "ws-test", name: "ws", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "word-search",
        categoryKey: "ws-test",
        name: "ws",
        description: "ws",
        subtypeTable: "word_search_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "word-search",
          slug: "t051-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await wordSearchModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t051mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload with cells and words and no placement", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.rows).toBe(4);
    expect(payload.cells).toHaveLength(16);
    expect(payload.words).toEqual(["CAT", "DOG"]);
    expect(Object.keys(payload).sort()).toEqual(["cells", "cols", "rows", "words"]);
    expect(JSON.stringify(payload)).not.toMatch(/start|end|direction|placement/);
  });

  it("rejects a payload that carries a placement", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, placements: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.parse({
        ...payload,
        cells: [{ row: 0, col: 0, letter: "C", start: true }],
      }),
    ).toThrow();
  });

  it("derives the placements from the stored grid", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toEqual([
      { word: "CAT", start: { row: 0, col: 0 }, end: { row: 0, col: 2 } },
      { word: "DOG", start: { row: 1, col: 3 }, end: { row: 3, col: 3 } },
    ]);
    const payload = await load(puzzleId);
    expect(
      check(payload, solution, {
        selections: [
          { start: { row: 0, col: 2 }, end: { row: 0, col: 0 } },
          { start: { row: 1, col: 3 }, end: { row: 3, col: 3 } },
        ],
      }).correct,
    ).toBe(true);
  });

  it("updates the grid in place and drops the cells and words that went", async () => {
    await db.transaction(async (tx) => {
      await wordSearchModule.upsertContent(tx, puzzleId, {
        grid: ["CATZ", "ZZZD", "ZZZO"],
        words: ["CAT"],
      });
    });
    const smaller = await load(puzzleId);
    expect(smaller.cells).toHaveLength(12);
    expect(smaller.words).toEqual(["CAT"]);
    await db.transaction(async (tx) => {
      await wordSearchModule.upsertContent(tx, puzzleId, content);
    });
    expect((await load(puzzleId)).cells).toHaveLength(16);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await wordSearchModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      wordSearchModule.replaceAttemptState(tx, attempt.id, { found: ["DOG", "CAT"] }),
    );
    expect(await wordSearchModule.loadAttemptState(attempt.id)).toEqual({
      found: ["CAT", "DOG"],
    });
    await db.transaction((tx) =>
      wordSearchModule.replaceAttemptState(tx, attempt.id, { found: ["CAT"] }),
    );
    expect(await wordSearchModule.loadAttemptState(attempt.id)).toEqual({
      found: ["CAT"],
    });

    await wordSearchModule.clearAttemptState(attempt.id);
    expect(await wordSearchModule.loadAttemptState(attempt.id)).toBeNull();
  });

  it("fails a content change that removes a found word", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId: await createTestUser("t051rm"), puzzleId })
      .returning({ id: attempts.id });
    await db.transaction((tx) =>
      wordSearchModule.replaceAttemptState(tx, attempt.id, { found: ["DOG"] }),
    );
    const error = await db
      .transaction((tx) =>
        wordSearchModule.upsertContent(tx, puzzleId, {
          grid: content.grid,
          words: ["CAT"],
        }),
      )
      .then(() => undefined, (cause: { cause?: { code?: string } }) => cause);
    expect(error?.cause?.code).toBe("23503");
    expect((await load(puzzleId)).words).toEqual(["CAT", "DOG"]);
    await wordSearchModule.clearAttemptState(attempt.id);
  });
});
