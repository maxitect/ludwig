import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { checkPuzzleAnswer } from "@/lib/data/puzzles";
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
  circle9AttemptCircles,
  circle9Attempts,
  circle9Numbers,
  circle9Puzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { content as fullCircle } from "../../../content/circle9/full-circle";
import { content as looseEnds } from "../../../content/circle9/loose-ends";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { circle9Module } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('c9-test', 'c9', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('circle9', 'c9-test', 'c9', 'c9', 'circle9_puzzles', 1),
           ('other', 'c9-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertCircle9(tx: Tx) {
  const puzzleId = await insertPuzzle(tx, "circle9");
  await tx.insert(circle9Puzzles).values({ puzzleId });
  return puzzleId;
}

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertCircle9(tx);
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(circle9Attempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("circle9 tables", () => {
  it("stores no solution column, no json and no array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'circle9%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(circled|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(circle9Puzzles).values({ puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a circle9 puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "circle9");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in circle9_puzzles/);
  });

  it.each([
    ["a digit of 0", { digit: 0 }],
    ["a digit of 10", { digit: 10 }],
    ["a row of 9", { row: 9 }],
    ["a column of 9", { col: 9 }],
    ["a negative row", { row: -1 }],
    ["a negative column", { col: -1 }],
  ])("rejects a number with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertCircle9(tx);
        await tx
          .insert(circle9Numbers)
          .values({ puzzleId, row: 0, col: 0, digit: 5, ...override });
      }),
    ).toBe("23514");
  });

  it.each([
    [0, 0, 1],
    [8, 8, 9],
    [4, 0, 5],
  ])("accepts a number at row %i, column %i with digit %i", async (row, col, digit) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertCircle9(tx);
        await tx.insert(circle9Numbers).values({ puzzleId, row, col, digit });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects two numbers on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertCircle9(tx);
        const number = { puzzleId, row: 0, col: 0, digit: 3 };
        await tx.insert(circle9Numbers).values([number, { ...number, digit: 4 }]);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t089tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(circle9Attempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it.each([
    ["a row of 9", { row: 9 }],
    ["a column of 9", { col: 9 }],
    ["a negative row", { row: -1 }],
  ])("rejects a circle with %s", async (_, override) => {
    const userId = await createTestUser("t089cir");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(circle9AttemptCircles)
          .values({ attemptId, row: 0, col: 0, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a duplicate circle, and accepts a circle on any cell", async () => {
    const userId = await createTestUser("t089dup");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const circle = { attemptId, row: 0, col: 1 };
        await tx.insert(circle9AttemptCircles).values([circle, circle]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(circle9AttemptCircles)
          .values({ attemptId, row: 8, col: 8 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });
});

describe("circle9 module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "c9-test", name: "c9", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "circle9",
        categoryKey: "c9-test",
        name: "c9",
        description: "c9",
        subtypeTable: "circle9_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "circle9",
          slug: "t089-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await circle9Module.upsertContent(tx, row.id, looseEnds);
      return row.id;
    });
    userId = await createTestUser("t089mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the numbers only, with no solution field", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload)).toEqual(["numbers"]);
    expect(JSON.stringify(payload)).not.toMatch(/solution|circle|answer/);
  });

  it("rejects a payload that carries the circles", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({
        ...payload,
        numbers: payload.numbers.map((number) => ({ ...number, circled: true })),
      }),
    ).toThrow();
  });

  it("solves the stored numbers to the one solution", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toHaveLength(9);
    const right = await checkPuzzleAnswer("circle9", puzzleId, {
      circles: solution,
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("circle9", puzzleId, {
      circles: solution.slice(1),
    });
    expect(wrong.correct).toBe(false);
  });

  it("updates the numbers in place", async () => {
    const count = async () => (await load(puzzleId)).numbers.length;
    const before = await count();
    await db.transaction((tx) =>
      circle9Module.upsertContent(tx, puzzleId, fullCircle),
    );
    expect(await count()).not.toBe(before);
    await db.transaction((tx) =>
      circle9Module.upsertContent(tx, puzzleId, looseEnds),
    );
    expect(await count()).toBe(before);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await circle9Module.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      circle9Module.replaceAttemptState(tx, attempt.id, {
        circles: [
          { row: 0, col: 1 },
          { row: 1, col: 3 },
        ],
      }),
    );
    const saved = await circle9Module.loadAttemptState(attempt.id);
    expect(saved?.circles).toHaveLength(2);

    await db.transaction((tx) =>
      circle9Module.replaceAttemptState(tx, attempt.id, {
        circles: [{ row: 2, col: 4 }],
      }),
    );
    expect(await circle9Module.loadAttemptState(attempt.id)).toEqual({
      circles: [{ row: 2, col: 4 }],
    });

    await circle9Module.clearAttemptState(attempt.id);
    expect(await circle9Module.loadAttemptState(attempt.id)).toBeNull();
  });
});
