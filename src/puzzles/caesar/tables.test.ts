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
  caesarAttempts,
  caesarPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { caesarModule } from "./module";
import { payloadSchema } from "./schema";

const content = { plaintext: "the lantern burns until dawn", shift: 3 };

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('cs-test', 'cs', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('caesar', 'cs-test', 'cs', 'cs', 'caesar_puzzles', 1),
           ('other', 'cs-test', 'other', 'other', 'zz_other_puzzles', 2)
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

describe("caesar_puzzles integrity", () => {
  it("stores no ciphertext, json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'caesar%'
        and (data_type in ('jsonb', 'json', 'ARRAY') or column_name like '%cipher%')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("generates type_key as caesar", async () => {
    const rows = await db.execute(sql`
      select table_name, generation_expression from information_schema.columns
      where table_name in ('caesar_puzzles', 'caesar_attempts')
        and column_name = 'type_key' order by table_name
    `);
    expect(rows.rows).toEqual([
      { table_name: "caesar_attempts", generation_expression: "'caesar'::text" },
      { table_name: "caesar_puzzles", generation_expression: "'caesar'::text" },
    ]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(caesarPuzzles).values({ ...content, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a caesar puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "caesar");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in caesar_puzzles/);
  });

  it("accepts a valid supertype and subtype pair, with shifts 1 and 25", async () => {
    for (const shift of [1, 25]) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertPuzzle(tx, "caesar");
          await tx
            .insert(caesarPuzzles)
            .values({ ...content, shift, puzzleId });
          await forceDeferred(tx);
        }),
      ).toBeUndefined();
    }
  });

  it.each([0, 26, -1])("rejects the shift %s", async (shift) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "caesar");
        await tx.insert(caesarPuzzles).values({ ...content, shift, puzzleId });
      }),
    ).toBe("23514");
  });

  it("rejects a caesar attempt of another puzzle type", async () => {
    const userId = await createTestUser("t052cstbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx
          .insert(caesarAttempts)
          .values({ attemptId: attempt.id, answer: "ink" });
      }),
    ).toBe("23503");
  });
});

describe("caesar module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "cs-test", name: "cs", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "caesar",
        categoryKey: "cs-test",
        name: "cs",
        description: "cs",
        subtypeTable: "caesar_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "caesar",
          slug: "t052-caesar-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await caesarModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t052csmod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload of the ciphertext alone", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload).toEqual({ ciphertext: "WKH ODQWHUQ EXUQV XQWLO GDZQ" });
    const json = JSON.stringify(payload);
    expect(json).not.toContain("lantern");
    expect(json).not.toContain("plaintext");
    expect(json).not.toContain("shift");
  });

  it("updates content in place on a second upsert", async () => {
    await db.transaction((tx) =>
      caesarModule.upsertContent(tx, puzzleId, { ...content, shift: 4 }),
    );
    expect((await loadSolution(puzzleId)).shift).toBe(4);
    await db.transaction((tx) =>
      caesarModule.upsertContent(tx, puzzleId, content),
    );
  });

  it("loads the solution and checks answers against it", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toEqual(content);
    expect(
      check(payload, solution, { answer: "The lantern burns until dawn." })
        .correct,
    ).toBe(true);
    expect(
      check(payload, solution, { answer: "the lantern burns until dusk" })
        .correct,
    ).toBe(false);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await caesarModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      caesarModule.replaceAttemptState(tx, attempt.id, { answer: "th_" }),
    );
    await db.transaction((tx) =>
      caesarModule.replaceAttemptState(tx, attempt.id, { answer: "the" }),
    );
    expect(await caesarModule.loadAttemptState(attempt.id)).toEqual({
      answer: "the",
    });

    await caesarModule.clearAttemptState(attempt.id);
    expect(await caesarModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
