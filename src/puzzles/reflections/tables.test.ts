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
  reflectionsAttemptMirrors,
  reflectionsAttempts,
  reflectionsFixedMirrors,
  reflectionsPorts,
  reflectionsPuzzles,
  reflectionsSlots,
} from "@/db/schema";
import { content as hallOfMirrors } from "../../../content/reflections/hall-of-mirrors";
import { content as shopWindow } from "../../../content/reflections/shop-window";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { reflectionsModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('rf-test', 'rf', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('reflections', 'rf-test', 'rf', 'rf', 'reflections_puzzles', 1),
           ('other', 'rf-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertReflections(
  tx: Tx,
  override: Partial<typeof reflectionsPuzzles.$inferInsert> = {},
) {
  const puzzleId = await insertPuzzle(tx, "reflections");
  await tx
    .insert(reflectionsPuzzles)
    .values({ puzzleId, rows: 4, cols: 4, ...override });
  return puzzleId;
}

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertReflections(tx);
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(reflectionsAttempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("reflections tables", () => {
  it("stores no solution column, no json and no array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'reflections%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(solution|answer)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the mirror_kind enum with slash and backslash", async () => {
    const { rows } = await db.execute<{ label: string }>(sql`
      select e.enumlabel as label from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'mirror_kind' order by e.enumsortorder
    `);
    expect(rows.map(({ label }) => label)).toEqual(["slash", "backslash"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(reflectionsPuzzles).values({ puzzleId, rows: 4, cols: 4 });
      }),
    ).toBe("23503");
  });

  it("rejects a reflections puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "reflections");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in reflections_puzzles/);
  });

  it.each([
    ["11 rows", { rows: 11 }],
    ["3 columns", { cols: 3 }],
  ] as const)("rejects a puzzle with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertReflections(tx, override);
      }),
    ).toBe("23514");
  });

  it("rejects a diagonal port side and a lowercase or multi-character label", async () => {
    for (const [side, label] of [
      ["ne", "A"],
      ["n", "a"],
      ["n", "1"],
    ]) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertReflections(tx);
          await tx.execute(
            sql`insert into reflections_ports (puzzle_id, side, "offset", label) values (${puzzleId}, ${side}, 0, ${label})`,
          );
        }),
      ).toBe("23514");
    }
  });

  it("rejects a port offset out of range, a duplicate port and a mirror kind outside the enum", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertReflections(tx);
        await tx
          .insert(reflectionsPorts)
          .values({ puzzleId, side: "n", offset: 10, label: "A" });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertReflections(tx);
        const port = { puzzleId, side: "n", offset: 0, label: "A" } as const;
        await tx.insert(reflectionsPorts).values([port, { ...port, label: "B" }]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertReflections(tx);
        await tx.execute(
          sql`insert into reflections_fixed_mirrors (puzzle_id, row, col, mirror) values (${puzzleId}, 0, 0, 'cross')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects a duplicate slot or fixed mirror and a cell out of range", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertReflections(tx);
        const slot = { puzzleId, row: 1, col: 1 };
        await tx.insert(reflectionsSlots).values([slot, slot]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertReflections(tx);
        await tx
          .insert(reflectionsFixedMirrors)
          .values({ puzzleId, row: 10, col: 0, mirror: "slash" });
      }),
    ).toBe("23514");
  });

  it("rejects an attempt of another puzzle type and a duplicate attempt mirror", async () => {
    const userId = await createTestUser("t098tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(reflectionsAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const mirror = { attemptId, row: 0, col: 0, mirror: "slash" } as const;
        await tx.insert(reflectionsAttemptMirrors).values([mirror, mirror]);
      }),
    ).toBe("23505");
  });
});

describe("reflections module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "rf-test", name: "rf", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "reflections",
        categoryKey: "rf-test",
        name: "rf",
        description: "rf",
        subtypeTable: "reflections_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "reflections",
          slug: "t098-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await reflectionsModule.upsertContent(tx, row.id, shopWindow);
      return row.id;
    });
    userId = await createTestUser("t098mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  const sorted = <T extends { row?: number; col?: number }>(items: T[]) =>
    [...items].sort(
      (a, b) => (a.row ?? 0) - (b.row ?? 0) || (a.col ?? 0) - (b.col ?? 0),
    );

  it("loads the grid, fixed mirrors, slots and ports only", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "cols",
      "fixedMirrors",
      "ports",
      "rows",
      "slots",
    ]);
    expect(payload.rows).toBe(shopWindow.rows);
    expect(sorted(payload.fixedMirrors)).toEqual(sorted(shopWindow.fixedMirrors));
    expect(sorted(payload.slots)).toEqual(sorted(shopWindow.slots));
    expect(payload.ports).toHaveLength(shopWindow.ports.length);
  });

  it("rejects a payload that carries the mirrors", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({
        ...payload,
        slots: payload.slots.map((slot) => ({ ...slot, mirror: "slash" })),
      }),
    ).toThrow();
  });

  it("solves the stored clues to the one answer and accepts it", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toHaveLength(shopWindow.slots.length);
    const right = await checkPuzzleAnswer("reflections", puzzleId, {
      mirrors: solution,
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("reflections", puzzleId, {
      mirrors: solution.slice(1),
    });
    expect(wrong.correct).toBe(false);
  });

  it("updates the clues in place, dropping rows the file no longer has", async () => {
    await db.transaction((tx) =>
      reflectionsModule.upsertContent(tx, puzzleId, hallOfMirrors),
    );
    const swapped = await load(puzzleId);
    expect(swapped.rows).toBe(hallOfMirrors.rows);
    expect(sorted(swapped.slots)).toEqual(sorted(hallOfMirrors.slots));
    expect(sorted(swapped.fixedMirrors)).toEqual(sorted(hallOfMirrors.fixedMirrors));
    expect(swapped.ports).toHaveLength(hallOfMirrors.ports.length);
    await db.transaction((tx) =>
      reflectionsModule.upsertContent(tx, puzzleId, shopWindow),
    );
    const back = await load(puzzleId);
    expect(sorted(back.slots)).toEqual(sorted(shopWindow.slots));
    expect(back.ports).toHaveLength(shopWindow.ports.length);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await reflectionsModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      reflectionsModule.replaceAttemptState(tx, attempt.id, {
        mirrors: [
          { row: 0, col: 0, mirror: "slash" },
          { row: 1, col: 1, mirror: "backslash" },
        ],
      }),
    );
    const saved = await reflectionsModule.loadAttemptState(attempt.id);
    expect(saved?.mirrors).toHaveLength(2);

    await db.transaction((tx) =>
      reflectionsModule.replaceAttemptState(tx, attempt.id, {
        mirrors: [{ row: 2, col: 2, mirror: "slash" }],
      }),
    );
    expect(await reflectionsModule.loadAttemptState(attempt.id)).toEqual({
      mirrors: [{ row: 2, col: 2, mirror: "slash" }],
    });

    await reflectionsModule.clearAttemptState(attempt.id);
    expect(await reflectionsModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
