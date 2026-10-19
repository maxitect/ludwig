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
  puzzleCategories,
  puzzleTypes,
  puzzles,
  norinoriAttemptMarks,
  norinoriAttempts,
  norinoriPuzzles,
  norinoriRegionCells,
} from "@/db/schema";
import { content as finePrint } from "../../../content/norinori/fine-print";
import { content as inkBlots } from "../../../content/norinori/ink-blots";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { norinoriModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('nr-test', 'nr', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('norinori', 'nr-test', 'nr', 'nr', 'norinori_puzzles', 1),
           ('other', 'nr-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const subtype = (puzzleId: string) => ({ puzzleId, rows: 6, cols: 6 });

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertPuzzle(tx, "norinori");
  await tx.insert(norinoriPuzzles).values(subtype(puzzleId));
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(norinoriAttempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("norinori tables", () => {
  it("stores no solution column, no json and no array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'norinori%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(shade_row|shade_col|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the norinori_mark enum", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'norinori_mark' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["shade", "dot"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(norinoriPuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a norinori puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "norinori");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in norinori_puzzles/);
  });

  it.each([
    ["rows of 4", { rows: 4 }],
    ["rows of 13", { rows: 13 }],
    ["cols of 4", { cols: 4 }],
    ["cols of 13", { cols: 13 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "norinori");
        await tx
          .insert(norinoriPuzzles)
          .values({ ...subtype(puzzleId), ...override });
      }),
    ).toBe("23514");
  });

  it.each([
    [5, 5],
    [12, 12],
    [6, 10],
  ])("accepts %i rows by %i columns", async (rows, cols) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "norinori");
        await tx
          .insert(norinoriPuzzles)
          .values({ ...subtype(puzzleId), rows, cols });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["a row of 12", { row: 12 }],
    ["a column of 12", { col: 12 }],
    ["a negative region", { region: -1 }],
    ["a negative row", { row: -1 }],
  ])("rejects a region cell with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "norinori");
        await tx.insert(norinoriPuzzles).values(subtype(puzzleId));
        await tx
          .insert(norinoriRegionCells)
          .values({ puzzleId, row: 0, col: 0, region: 0, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a duplicate region cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "norinori");
        await tx.insert(norinoriPuzzles).values(subtype(puzzleId));
        const cell = { puzzleId, row: 0, col: 0, region: 0 };
        await tx.insert(norinoriRegionCells).values([cell, cell]);
      }),
    ).toBe("23505");
  });

  it("does not catch a missing cell or a one-cell region: puzzles:verify does", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "norinori");
        await tx.insert(norinoriPuzzles).values(subtype(puzzleId));
        await tx
          .insert(norinoriRegionCells)
          .values({ puzzleId, row: 0, col: 0, region: 0 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t097tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(norinoriAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a duplicate mark, an unknown mark and a negative cell", async () => {
    const userId = await createTestUser("t097mark");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const mark = { attemptId, row: 0, col: 1, mark: "shade" as const };
        await tx.insert(norinoriAttemptMarks).values([mark, mark]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx.execute(
          sql`insert into norinori_attempt_marks (attempt_id, row, col, mark) values (${attemptId}, 0, 0, 'moon')`,
        );
      }),
    ).toBe("22P02");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(norinoriAttemptMarks)
          .values({ attemptId, row: -1, col: 0, mark: "dot" });
      }),
    ).toBe("23514");
  });
});

describe("norinori module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "nr-test", name: "nr", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "norinori",
        categoryKey: "nr-test",
        name: "nr",
        description: "nr",
        subtypeTable: "norinori_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "norinori",
          slug: "t097-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await norinoriModule.upsertContent(tx, row.id, finePrint);
      return row.id;
    });
    userId = await createTestUser("t097mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the size and regions only, with no solution field", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual(["cols", "regions", "rows"]);
    expect(payload.regions).toHaveLength(64);
    expect(JSON.stringify(payload)).not.toMatch(/solution|shade|answer/);
  });

  it("rejects a payload that carries the shaded cells", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({
        ...payload,
        regions: payload.regions.map((cell) => ({ ...cell, shaded: true })),
      }),
    ).toThrow();
  });

  it("solves the stored regions to the one solution", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toHaveLength(26);
    const right = await checkPuzzleAnswer("norinori", puzzleId, {
      shaded: solution,
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("norinori", puzzleId, {
      shaded: solution.slice(1),
    });
    expect(wrong.correct).toBe(false);
  });

  it("updates the regions in place", async () => {
    await db.transaction((tx) =>
      norinoriModule.upsertContent(tx, puzzleId, inkBlots),
    );
    const small = await load(puzzleId);
    expect(small).toMatchObject({ rows: 6, cols: 6 });
    expect(small.regions).toHaveLength(36);
    await db.transaction((tx) =>
      norinoriModule.upsertContent(tx, puzzleId, finePrint),
    );
    const restored = await load(puzzleId);
    expect(restored).toMatchObject({ rows: 8, cols: 8 });
    expect(restored.regions).toHaveLength(64);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await norinoriModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      norinoriModule.replaceAttemptState(tx, attempt.id, {
        marks: [
          { row: 0, col: 1, mark: "shade" },
          { row: 1, col: 3, mark: "dot" },
        ],
      }),
    );
    const saved = await norinoriModule.loadAttemptState(attempt.id);
    expect(saved?.marks).toHaveLength(2);

    await db.transaction((tx) =>
      norinoriModule.replaceAttemptState(tx, attempt.id, {
        marks: [{ row: 2, col: 4, mark: "dot" }],
      }),
    );
    expect(await norinoriModule.loadAttemptState(attempt.id)).toEqual({
      marks: [{ row: 2, col: 4, mark: "dot" }],
    });

    await norinoriModule.clearAttemptState(attempt.id);
    expect(await norinoriModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
