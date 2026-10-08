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
  wordLadderAttempts,
  wordLadderAttemptRungs,
  wordLadderPuzzles,
  wordLadderSolutionRungs,
  words,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { wordLadderModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  startWord: "head",
  endWord: "tail",
  rungs: ["held", "hell", "tell", "tall"],
};

async function ensureWords(tx: Tx) {
  await tx
    .insert(words)
    .values(
      ["head", "held", "hell", "tell", "tall", "tail"].map(
        (word) => ({ word }),
      ),
    )
    .onConflictDoNothing();
}

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('wl-test', 'wl', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('word-ladder', 'wl-test', 'wl', 'wl', 'word_ladder_puzzles', 1),
           ('other', 'wl-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  await ensureTypes(tx);
  await ensureWords(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

const subtype = { startWord: "head", endWord: "tail", rungCount: 4 };

describe("word ladder tables", () => {
  it("creates no json or array columns", async () => {
    const rows = await db.execute(sql`
      select table_name, data_type from information_schema.columns
      where (table_name like 'word_ladder%' or table_name = 'words')
        and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(wordLadderPuzzles).values({ ...subtype, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a word ladder puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "word-ladder");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in word_ladder_puzzles/);
  });

  it("accepts a valid supertype and subtype pair", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-ladder");
        await tx.insert(wordLadderPuzzles).values({ ...subtype, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["start", { startWord: "zzzq" }],
    ["end", { endWord: "zzzq" }],
  ])("rejects a %s word that is not in the dictionary", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-ladder");
        await tx
          .insert(wordLadderPuzzles)
          .values({ ...subtype, ...override, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a rung count below one", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-ladder");
        await tx
          .insert(wordLadderPuzzles)
          .values({ ...subtype, rungCount: 0, puzzleId });
      }),
    ).toBe("23514");
  });

  it("rejects a reference rung that is not in the dictionary", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-ladder");
        await tx.insert(wordLadderPuzzles).values({ ...subtype, puzzleId });
        await tx
          .insert(wordLadderSolutionRungs)
          .values({ puzzleId, position: 0, word: "zzzq" });
      }),
    ).toBe("23503");
  });

  it.each(["Head", "he", "headers", "he-ad", "hé"])(
    "rejects the dictionary word %s",
    async (word) => {
      expect(
        await pgErrorCode(async (tx) => {
          await tx.insert(words).values({ word });
        }),
      ).toBe("23514");
    },
  );

  it("rejects a word ladder attempt of another puzzle type", async () => {
    const userId = await createTestUser("t049tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx
          .insert(wordLadderAttempts)
          .values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("keeps whatever the player typed, in words or not", async () => {
    const userId = await createTestUser("t049typed");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "word-ladder");
        await tx.insert(wordLadderPuzzles).values({ ...subtype, puzzleId });
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(wordLadderAttempts).values({ attemptId: attempt.id });
        await tx.insert(wordLadderAttemptRungs).values([
          { attemptId: attempt.id, position: 0, word: "zzzq" },
          { attemptId: attempt.id, position: 1, word: "he" },
        ]);
      }),
    ).toBeUndefined();
  });
});

describe("word ladder module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "wl-test", name: "wl", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "word-ladder",
        categoryKey: "wl-test",
        name: "wl",
        description: "wl",
        subtypeTable: "word_ladder_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    await db
      .insert(words)
      .values(
        [
          ...content.rungs,
          content.startWord,
          content.endWord,
          "toll",
          "heal",
          "teal",
        ].map((word) => ({ word })),
      )
      .onConflictDoNothing();
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "word-ladder",
          slug: "t049-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await wordLadderModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t049mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds no reference rung", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload).toEqual({ startWord: "head", endWord: "tail", rungCount: 4 });
    expect(JSON.stringify(payload)).not.toContain("hell");
  });

  it("loads the dictionary of the right length", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution.dictionary).toEqual(
      expect.arrayContaining(["head", "tail", "held"]),
    );
    expect(solution.dictionary.every((word) => word.length === 4)).toBe(true);
  });

  it("accepts a ladder that differs from the reference", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    const other = ["head", "heal", "teal", "tell", "tall", "tail"];
    expect(check(payload, solution, { ladder: other }).correct).toBe(true);
    expect(
      check(payload, solution, {
        ladder: ["head", "held", "hell", "tell", "tall", "tail"],
      }).correct,
    ).toBe(true);
    expect(
      check(payload, solution, {
        ladder: ["head", "held", "hell", "tell", "tail"],
      }).correct,
    ).toBe(false);
  });

  it("updates the reference rungs in place and drops the ones that went", async () => {
    await db.transaction(async (tx) => {
      await wordLadderModule.upsertContent(tx, puzzleId, {
        startWord: "head",
        endWord: "tail",
        rungs: ["held", "hell", "tell", "toll", "tall"],
      });
    });
    expect((await load(puzzleId)).rungCount).toBe(5);
    await db.transaction(async (tx) => {
      await wordLadderModule.upsertContent(tx, puzzleId, content);
    });
    const stored = await db
      .select({ word: wordLadderSolutionRungs.word })
      .from(wordLadderSolutionRungs)
      .where(eq(wordLadderSolutionRungs.puzzleId, puzzleId))
      .orderBy(wordLadderSolutionRungs.position);
    expect(stored.map(({ word }) => word)).toEqual(content.rungs);
    expect((await load(puzzleId)).rungCount).toBe(4);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await wordLadderModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      wordLadderModule.replaceAttemptState(tx, attempt.id, {
        rungs: [
          { position: 0, word: "held" },
          { position: 2, word: "te" },
        ],
      }),
    );
    await db.transaction((tx) =>
      wordLadderModule.replaceAttemptState(tx, attempt.id, {
        rungs: [{ position: 1, word: "hell" }],
      }),
    );
    expect(await wordLadderModule.loadAttemptState(attempt.id)).toEqual({
      rungs: [{ position: 1, word: "hell" }],
    });

    await db.transaction((tx) =>
      wordLadderModule.replaceAttemptState(tx, attempt.id, { rungs: [] }),
    );
    expect(await wordLadderModule.loadAttemptState(attempt.id)).toEqual({
      rungs: [],
    });

    await wordLadderModule.clearAttemptState(attempt.id);
    expect(await wordLadderModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
