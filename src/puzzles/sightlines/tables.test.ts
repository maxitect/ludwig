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
  sightlinesAttemptMarks,
  sightlinesAttempts,
  sightlinesObservers,
  sightlinesObstacles,
  sightlinesPuzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { sightlinesModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  grid: ["...#.", ".....", "....."],
  targetRow: 0,
  targetCol: 4,
  observers: [{ row: 0, col: 0, facing: "e" as const, fovDeg: 90 }],
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('sl-test', 'sl', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('sightlines', 'sl-test', 'sl', 'sl', 'sightlines_puzzles', 1),
           ('other', 'sl-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const subtype = (puzzleId: string) => ({
  puzzleId,
  rows: 3,
  cols: 5,
  targetRow: 0,
  targetCol: 4,
});

describe("sightlines tables", () => {
  it("stores no blind or visible column, and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'sightlines%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(blind|visible|visibility|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the compass8 enum in compass order", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'compass8' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual([
      "n",
      "ne",
      "e",
      "se",
      "s",
      "sw",
      "w",
      "nw",
    ]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a sightlines puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "sightlines");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in sightlines_puzzles/);
  });

  it("accepts a valid puzzle with obstacles and observers", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        await tx
          .insert(sightlinesObstacles)
          .values({ puzzleId, row: 0, col: 3 });
        await tx.insert(sightlinesObservers).values({
          puzzleId,
          row: 0,
          col: 0,
          facing: "e",
          fovDeg: 90,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([0, -5, 361])("rejects an observer with fov_deg %i", async (fovDeg) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        await tx.insert(sightlinesObservers).values({
          puzzleId,
          row: 0,
          col: 0,
          facing: "e",
          fovDeg,
        });
      }),
    ).toBe("23514");
  });

  it.each([1, 360])("accepts an observer with fov_deg %i", async (fovDeg) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        await tx.insert(sightlinesObservers).values({
          puzzleId,
          row: 0,
          col: 0,
          facing: "e",
          fovDeg,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a facing outside the compass", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        await tx.execute(
          sql`insert into sightlines_observers (puzzle_id, row, col, facing, fov_deg) values (${puzzleId}, 0, 0, 'up', 90)`,
        );
      }),
    ).toBe("22P02");
  });

  it.each([
    ["a target row past the grid", { targetRow: 3 }],
    ["a target column past the grid", { targetCol: 5 }],
    ["a negative target row", { targetRow: -1 }],
    ["a grid of 2 rows", { rows: 2, targetRow: 0 }],
    ["a grid of 16 columns", { cols: 16 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx
          .insert(sightlinesPuzzles)
          .values({ ...subtype(puzzleId), ...override });
      }),
    ).toBe("23514");
  });

  it("does not catch an observer on a pillar: puzzles:verify does", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        await tx
          .insert(sightlinesObstacles)
          .values({ puzzleId, row: 1, col: 1 });
        await tx.insert(sightlinesObservers).values({
          puzzleId,
          row: 1,
          col: 1,
          facing: "n",
          fovDeg: 90,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a duplicate obstacle and a duplicate observer", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        const obstacle = { puzzleId, row: 1, col: 1 };
        await tx.insert(sightlinesObstacles).values([obstacle, obstacle]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        const observer = {
          puzzleId,
          row: 1,
          col: 1,
          facing: "n" as const,
          fovDeg: 90,
        };
        await tx.insert(sightlinesObservers).values([observer, observer]);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t059tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(sightlinesAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a duplicate mark and a negative mark", async () => {
    const userId = await createTestUser("t059mark");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(sightlinesAttempts).values({ attemptId: attempt.id });
        const mark = { attemptId: attempt.id, row: 0, col: 1 };
        await tx.insert(sightlinesAttemptMarks).values([mark, mark]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "sightlines");
        await tx.insert(sightlinesPuzzles).values(subtype(puzzleId));
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(sightlinesAttempts).values({ attemptId: attempt.id });
        await tx
          .insert(sightlinesAttemptMarks)
          .values({ attemptId: attempt.id, row: -1, col: 0 });
      }),
    ).toBe("23514");
  });
});

describe("sightlines module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "sl-test", name: "sl", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "sightlines",
        categoryKey: "sl-test",
        name: "sl",
        description: "sl",
        subtypeTable: "sightlines_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "sightlines",
          slug: "t059-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await sightlinesModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t059mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the layout only, with no solution field", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "cols",
      "observers",
      "obstacles",
      "rows",
      "targetCol",
      "targetRow",
    ]);
    expect(payload.obstacles).toEqual([{ row: 0, col: 3 }]);
    expect(JSON.stringify(payload)).not.toMatch(/blind|visible|solution/);
  });

  it("rejects a payload that carries the blind spots", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, blindSpots: [] }),
    ).toThrow();
  });

  it("derives the blind spots from the stored layout", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toEqual([
      { row: 0, col: 4 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
    ]);
    expect(
      check(await load(puzzleId), solution, { marks: solution }).correct,
    ).toBe(true);
  });

  it("returns no wrong-cell count to the client", async () => {
    const wrong = await checkPuzzleAnswer("sightlines", puzzleId, {
      marks: [{ row: 0, col: 4 }],
    });
    expect(wrong).toEqual({ correct: false });
    const right = await checkPuzzleAnswer("sightlines", puzzleId, {
      marks: await loadSolution(puzzleId),
    });
    expect(right).toEqual({ correct: true });
  });

  it("updates the layout in place", async () => {
    await db.transaction((tx) =>
      sightlinesModule.upsertContent(tx, puzzleId, {
        ...content,
        grid: ["....#", ".....", "....."],
      }),
    );
    expect((await load(puzzleId)).obstacles).toEqual([{ row: 0, col: 4 }]);
    await db.transaction((tx) =>
      sightlinesModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).obstacles).toEqual([{ row: 0, col: 3 }]);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await sightlinesModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      sightlinesModule.replaceAttemptState(tx, attempt.id, {
        marks: [
          { row: 0, col: 4 },
          { row: 1, col: 3 },
        ],
      }),
    );
    const saved = await sightlinesModule.loadAttemptState(attempt.id);
    expect(saved?.marks).toHaveLength(2);

    await db.transaction((tx) =>
      sightlinesModule.replaceAttemptState(tx, attempt.id, {
        marks: [{ row: 2, col: 4 }],
      }),
    );
    expect(await sightlinesModule.loadAttemptState(attempt.id)).toEqual({
      marks: [{ row: 2, col: 4 }],
    });

    await sightlinesModule.clearAttemptState(attempt.id);
    expect(await sightlinesModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
