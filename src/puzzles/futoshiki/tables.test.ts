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
  futoshikiAttemptCells,
  futoshikiAttemptNotes,
  futoshikiAttempts,
  futoshikiGivens,
  futoshikiInequalities,
  futoshikiPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { payload, solution } from "./fixture";
import { futoshikiModule } from "./module";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('fut-test', 'fut', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('futoshiki', 'fut-test', 'fut', 'fut', 'futoshiki_puzzles', 1),
           ('other', 'fut-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertFutoshiki(tx: Tx, size = 5) {
  const puzzleId = await insertPuzzle(tx, "futoshiki");
  await tx.insert(futoshikiPuzzles).values({ puzzleId, size });
  return puzzleId;
}

describe("futoshiki_puzzles integrity", () => {
  it("stores no solution column and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'futoshiki%'
        and (column_name like '%solution%' or data_type in ('jsonb', 'json', 'ARRAY'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("declares ineq_direction and ineq_relation with only their values", async () => {
    const rows = await db.execute<{ typname: string; labels: string }>(sql`
      select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      where t.typname in ('ineq_direction', 'ineq_relation')
      group by t.typname order by t.typname
    `);
    expect(rows.rows).toEqual([
      { typname: "ineq_direction", labels: "right,down" },
      { typname: "ineq_relation", labels: "lt,gt" },
    ]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(futoshikiPuzzles).values({ puzzleId, size: 5 });
      }),
    ).toBe("23503");
  });

  it("rejects a futoshiki puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "futoshiki");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in futoshiki_puzzles/);
  });

  it("accepts a valid supertype, subtype, given and inequality", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx
          .insert(futoshikiGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 5 });
        await tx.insert(futoshikiInequalities).values({
          puzzleId,
          row: 0,
          col: 0,
          direction: "right",
          relation: "lt",
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([3, 8])("rejects a size of %i", async (size) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertFutoshiki(tx, size);
      }),
    ).toBe("23514");
  });

  it.each([
    ["digit 0", { digit: 0 }],
    ["digit 10", { digit: 10 }],
    ["row 7", { row: 7 }],
    ["row -1", { row: -1 }],
    ["col 7", { col: 7 }],
    ["col -1", { col: -1 }],
  ])("rejects a given with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx
          .insert(futoshikiGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 5, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects two givens on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx.insert(futoshikiGivens).values([
          { puzzleId, row: 4, col: 4, digit: 1 },
          { puzzleId, row: 4, col: 4, digit: 2 },
        ]);
      }),
    ).toBe("23505");
  });
});

describe("futoshiki_inequalities integrity", () => {
  const base = { row: 1, col: 1, direction: "right", relation: "lt" } as const;

  it("accepts both directions on one cell and both relations", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx.insert(futoshikiInequalities).values([
          { puzzleId, ...base },
          { puzzleId, ...base, direction: "down", relation: "gt" },
        ]);
      }),
    ).toBeUndefined();
  });

  it("rejects two signs on the same cell edge, even with a different relation", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx.insert(futoshikiInequalities).values([
          { puzzleId, ...base },
          { puzzleId, ...base, relation: "gt" },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects a relation outside lt and gt and a direction outside right and down", async () => {
    for (const [column, value] of [
      ["relation", "eq"],
      ["direction", "left"],
    ]) {
      const error = await pgError(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx.execute(sql`
          insert into futoshiki_inequalities (puzzle_id, row, col, direction, relation)
          values (${puzzleId}, 1, 1,
            ${column === "direction" ? value : "right"}::text::ineq_direction,
            ${column === "relation" ? value : "lt"}::text::ineq_relation)
        `);
      });
      expect(error?.code).toBe("22P02");
    }
  });

  it.each([
    ["row 7", { row: 7 }],
    ["row -1", { row: -1 }],
    ["col 7", { col: 7 }],
    ["col -1", { col: -1 }],
  ])("rejects an inequality with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFutoshiki(tx);
        await tx
          .insert(futoshikiInequalities)
          .values({ puzzleId, ...base, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects an inequality for a puzzle with no futoshiki subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(futoshikiInequalities).values({ puzzleId, ...base });
      }),
    ).toBe("23503");
  });
});

describe("futoshiki module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const upsert = (content: typeof payload) =>
    db.transaction((tx) => futoshikiModule.upsertContent(tx, puzzleId, content));

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "fut-test", name: "fut", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "futoshiki",
        categoryKey: "fut-test",
        name: "fut",
        description: "fut",
        subtypeTable: "futoshiki_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "futoshiki",
          slug: "t047-module",
          title: "t047",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await futoshikiModule.upsertContent(tx, row.id, payload);
      return row.id;
    });
    userId = await createTestUser("t047mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't047-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload of size, givens and signs, and the strict schema rejects a solution", async () => {
    const loaded = await load(puzzleId);
    expect(payloadSchema.strict().parse(loaded)).toEqual(loaded);
    expect(Object.keys(loaded).sort()).toEqual([
      "givens",
      "inequalities",
      "size",
    ]);
    expect(loaded.size).toBe(payload.size);
    expect(loaded.givens).toHaveLength(payload.givens.length);
    expect(loaded.inequalities).toHaveLength(payload.inequalities.length);
    expect(
      payloadSchema.strict().safeParse({ ...loaded, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema
        .strict()
        .safeParse({
          ...loaded,
          givens: [{ row: 0, col: 0, digit: 1, solved: 1 }],
        }).success,
    ).toBe(false);
  });

  it("derives the solution from the puzzle", async () => {
    const [loaded, derived] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(derived).toEqual(solution);
    expect(check(loaded, derived, { cells: derived }).correct).toBe(true);
  });

  it("re-seeding the same content leaves one row per given and per sign", async () => {
    await upsert(payload);
    const [givens, signs] = await Promise.all([
      db
        .select()
        .from(futoshikiGivens)
        .where(eq(futoshikiGivens.puzzleId, puzzleId)),
      db
        .select()
        .from(futoshikiInequalities)
        .where(eq(futoshikiInequalities.puzzleId, puzzleId)),
    ]);
    expect(givens).toHaveLength(payload.givens.length);
    expect(signs).toHaveLength(payload.inequalities.length);
  });

  it("re-seeding changed content updates in place and removes dropped rows", async () => {
    const [droppedGiven, changedGiven, ...givens] = payload.givens;
    const [droppedSign, changedSign, ...inequalities] = payload.inequalities;
    await upsert({
      size: 4,
      givens: [{ ...changedGiven, digit: 2 }, ...givens],
      inequalities: [
        {
          ...changedSign,
          relation: changedSign.relation === "lt" ? "gt" : "lt",
        },
        ...inequalities,
      ],
    });
    const [givenRows, signRows] = await Promise.all([
      db
        .select({
          row: futoshikiGivens.row,
          col: futoshikiGivens.col,
          digit: futoshikiGivens.digit,
        })
        .from(futoshikiGivens)
        .where(eq(futoshikiGivens.puzzleId, puzzleId)),
      db
        .select({
          row: futoshikiInequalities.row,
          col: futoshikiInequalities.col,
          direction: futoshikiInequalities.direction,
          relation: futoshikiInequalities.relation,
        })
        .from(futoshikiInequalities)
        .where(eq(futoshikiInequalities.puzzleId, puzzleId)),
    ]);
    expect(givenRows).toHaveLength(payload.givens.length - 1);
    expect(givenRows).not.toContainEqual(droppedGiven);
    expect(givenRows).toContainEqual({ ...changedGiven, digit: 2 });
    expect(signRows).toHaveLength(payload.inequalities.length - 1);
    expect(signRows).not.toContainEqual(droppedSign);
    expect(signRows).toContainEqual({
      ...changedSign,
      relation: changedSign.relation === "lt" ? "gt" : "lt",
    });

    await upsert(payload);
  });

  it("re-seeding content with no givens or signs clears them", async () => {
    await upsert({ size: 5, givens: [], inequalities: [] });
    const [subtype] = await db
      .select({ size: futoshikiPuzzles.size })
      .from(futoshikiPuzzles)
      .where(eq(futoshikiPuzzles.puzzleId, puzzleId));
    const givens = await db
      .select()
      .from(futoshikiGivens)
      .where(eq(futoshikiGivens.puzzleId, puzzleId));
    expect(subtype.size).toBe(5);
    expect(givens).toHaveLength(0);

    await upsert(payload);
  });

  it("replaces, reads back and clears digits and notes", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await futoshikiModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      futoshikiModule.replaceAttemptState(tx, attempt.id, {
        cells: [{ row: 0, col: 2, digit: 4 }],
        notes: [
          { row: 0, col: 3, digit: 3 },
          { row: 0, col: 3, digit: 2 },
        ],
      }),
    );
    await db.transaction((tx) =>
      futoshikiModule.replaceAttemptState(tx, attempt.id, {
        cells: [
          { row: 0, col: 2, digit: 4 },
          { row: 0, col: 3, digit: 3 },
        ],
        notes: [{ row: 1, col: 1, digit: 2 }],
      }),
    );
    const state = await futoshikiModule.loadAttemptState(attempt.id);
    expect(state?.cells).toHaveLength(2);
    expect(state?.notes).toEqual([{ row: 1, col: 1, digit: 2 }]);

    await futoshikiModule.clearAttemptState(attempt.id);
    expect(await futoshikiModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(futoshikiAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it.each([
      ["digit 0", { digit: 0 }],
      ["digit 10", { digit: 10 }],
      ["row 7", { row: 7 }],
      ["col -1", { col: -1 }],
    ])("rejects an attempt cell and a note with %s", async (_label, override) => {
      const base = { row: 0, col: 0, digit: 5 };
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(futoshikiAttemptCells)
            .values({ attemptId, ...base, ...override });
        }),
      ).toBe("23514");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(futoshikiAttemptNotes)
            .values({ attemptId, ...base, ...override });
        }),
      ).toBe("23514");
    });

    it("rejects a duplicate cell and a duplicate note, and allows several notes per cell", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(futoshikiAttemptCells).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 2 },
          ]);
        }),
      ).toBe("23505");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(futoshikiAttemptNotes).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 1 },
          ]);
        }),
      ).toBe("23505");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(futoshikiAttemptNotes).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 2 },
          ]);
        }),
      ).toBeUndefined();
    });

    it("rejects an attempt subtype row for a puzzle of another attempt type, and cascades on delete", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t047-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(futoshikiAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(futoshikiAttemptCells)
            .values({ attemptId, row: 0, col: 0, digit: 1 });
          await tx.delete(attempts).where(eq(attempts.id, attemptId));
          const left = await tx
            .select()
            .from(futoshikiAttemptCells)
            .where(eq(futoshikiAttemptCells.attemptId, attemptId));
          if (left.length) throw new Error("cells were not cascaded");
        }),
      ).toBeUndefined();
    });
  });
});
