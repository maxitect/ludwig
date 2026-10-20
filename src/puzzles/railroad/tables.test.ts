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
  railroadAttemptCrosses,
  railroadAttemptPieces,
  railroadAttempts,
  railroadGivenPieces,
  railroadPuzzles,
  railroadRowCounts,
} from "@/db/schema";
import { content as lastStop } from "../../../content/railroad/last-stop";
import { content as nightTrain } from "../../../content/railroad/night-train";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { railroadModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('rr-test', 'rr', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('railroad', 'rr-test', 'rr', 'rr', 'railroad_puzzles', 1),
           ('other', 'rr-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const ends = {
  entryRow: 0,
  entryCol: 0,
  entrySide: "w",
  exitRow: 3,
  exitCol: 3,
  exitSide: "e",
} as const;

async function insertRailroad(
  tx: Tx,
  override: Partial<typeof railroadPuzzles.$inferInsert> = {},
) {
  const puzzleId = await insertPuzzle(tx, "railroad");
  await tx
    .insert(railroadPuzzles)
    .values({ puzzleId, rows: 4, cols: 4, ...ends, ...override });
  return puzzleId;
}

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertRailroad(tx);
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(railroadAttempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("railroad tables", () => {
  it("stores no solution column, no json and no array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'railroad%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(track|solution|path)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the track_piece enum with the six pieces", async () => {
    const { rows } = await db.execute<{ label: string }>(sql`
      select e.enumlabel as label from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'track_piece' order by e.enumsortorder
    `);
    expect(rows.map(({ label }) => label)).toEqual([
      "ns",
      "ew",
      "ne",
      "nw",
      "se",
      "sw",
    ]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(railroadPuzzles)
          .values({ puzzleId, rows: 4, cols: 4, ...ends });
      }),
    ).toBe("23503");
  });

  it("rejects a railroad puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "railroad");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in railroad_puzzles/);
  });

  it.each([
    ["a diagonal entry side", { entrySide: "ne" }],
    ["a diagonal exit side", { exitSide: "sw" }],
    ["12 rows", { rows: 12 }],
    ["11 columns", { cols: 11 }],
    ["3 rows", { rows: 3 }],
    ["an entry row outside the grid", { entryRow: 4 }],
    ["an exit column outside the grid", { exitCol: 4 }],
    ["a negative entry column", { entryCol: -1 }],
  ] as const)("rejects a puzzle with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertRailroad(tx, override);
      }),
    ).toBe("23514");
  });

  it("accepts the smallest and the largest grids", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertRailroad(tx);
        await insertPuzzle(tx, "railroad", "big").then((puzzleId) =>
          tx.insert(railroadPuzzles).values({
            puzzleId,
            rows: 10,
            cols: 10,
            ...ends,
            exitRow: 9,
            exitCol: 9,
          }),
        );
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a count out of range, a duplicate row count and a piece off the board", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertRailroad(tx);
        await tx.insert(railroadRowCounts).values({ puzzleId, row: 0, count: 11 });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertRailroad(tx);
        const count = { puzzleId, row: 0, count: 2 };
        await tx.insert(railroadRowCounts).values([count, count]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertRailroad(tx);
        await tx
          .insert(railroadGivenPieces)
          .values({ puzzleId, row: 10, col: 0, piece: "ns" });
      }),
    ).toBe("23514");
  });

  it("rejects a piece that is not one of the six", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertRailroad(tx);
        await tx.execute(
          sql`insert into railroad_given_pieces (puzzle_id, row, col, piece) values (${puzzleId}, 0, 0, 'cross')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t086tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(railroadAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a duplicate attempt piece or cross, and a coordinate out of range", async () => {
    const userId = await createTestUser("t086dup");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const piece = { attemptId, row: 0, col: 0, piece: "ns" } as const;
        await tx.insert(railroadAttemptPieces).values([piece, piece]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const cross = { attemptId, row: 1, col: 1 };
        await tx.insert(railroadAttemptCrosses).values([cross, cross]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(railroadAttemptCrosses)
          .values({ attemptId, row: 10, col: 0 });
      }),
    ).toBe("23514");
  });
});

describe("railroad module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "rr-test", name: "rr", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "railroad",
        categoryKey: "rr-test",
        name: "rr",
        description: "rr",
        subtypeTable: "railroad_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "railroad",
          slug: "t086-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await railroadModule.upsertContent(tx, row.id, nightTrain);
      return row.id;
    });
    userId = await createTestUser("t086mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the size, ends, counts and given pieces only", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "colCounts",
      "cols",
      "entry",
      "exit",
      "given",
      "rowCounts",
      "rows",
    ]);
    expect(payload).toEqual(nightTrain);
  });

  it("rejects a payload that carries the track", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({ ...payload, track: [] }),
    ).toThrow();
  });

  it("solves the stored clues to the one track and accepts it", async () => {
    const solution = await loadSolution(puzzleId);
    const right = await checkPuzzleAnswer("railroad", puzzleId, {
      pieces: solution,
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("railroad", puzzleId, {
      pieces: solution.slice(1),
    });
    expect(wrong.correct).toBe(false);
  });

  it("updates the clues in place, dropping counts and givens the file no longer has", async () => {
    await db.transaction((tx) =>
      railroadModule.upsertContent(tx, puzzleId, lastStop),
    );
    expect(await load(puzzleId)).toEqual(lastStop);
    await db.transaction((tx) =>
      railroadModule.upsertContent(tx, puzzleId, nightTrain),
    );
    expect(await load(puzzleId)).toEqual(nightTrain);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await railroadModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      railroadModule.replaceAttemptState(tx, attempt.id, {
        pieces: [
          { row: 0, col: 2, piece: "ne" },
          { row: 0, col: 3, piece: "ew" },
        ],
        crosses: [{ row: 5, col: 5 }],
      }),
    );
    const saved = await railroadModule.loadAttemptState(attempt.id);
    expect(saved?.pieces).toHaveLength(2);
    expect(saved?.crosses).toEqual([{ row: 5, col: 5 }]);

    await db.transaction((tx) =>
      railroadModule.replaceAttemptState(tx, attempt.id, {
        pieces: [{ row: 1, col: 1, piece: "sw" }],
        crosses: [],
      }),
    );
    expect(await railroadModule.loadAttemptState(attempt.id)).toEqual({
      pieces: [{ row: 1, col: 1, piece: "sw" }],
      crosses: [],
    });

    await railroadModule.clearAttemptState(attempt.id);
    expect(await railroadModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
