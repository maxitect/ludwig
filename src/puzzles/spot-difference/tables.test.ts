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
  spotDifferenceAttemptFound,
  spotDifferenceAttempts,
  spotDifferenceDifferences,
  spotDifferencePuzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { spotDifferenceModule } from "./module";
import { payloadSchema } from "./schema";

const differences = Array.from({ length: 5 }, (_, i) => ({
  x: i * 100,
  y: 50,
  width: 80,
  height: 60,
}));
const content = { sceneKey: "fixture-clandon", differences };
const subtype = { sceneKey: content.sceneKey };

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('sd-test', 'sd', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('spot-difference', 'sd-test', 'sd', 'sd', 'spot_difference_puzzles', 1),
           ('other', 'sd-test', 'other', 'other', 'zz_other_puzzles', 2)
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

describe("spot_difference_puzzles integrity", () => {
  it("stores only the scene key", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_name = 'spot_difference_puzzles' order by ordinal_position
    `);
    expect(rows.rows.map((row) => row.column_name)).toEqual([
      "puzzle_id",
      "type_key",
      "scene_key",
    ]);
  });

  it("creates no json or array columns", async () => {
    const rows = await db.execute(sql`
      select table_name, data_type from information_schema.columns
      where table_name like 'spot_difference%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(spotDifferencePuzzles).values({ ...subtype, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a spot-difference puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "spot-difference");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in spot_difference_puzzles/);
  });

  it("accepts a valid supertype and subtype pair", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "spot-difference");
        await tx.insert(spotDifferencePuzzles).values({ ...subtype, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects an empty scene key", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "spot-difference");
        await tx
          .insert(spotDifferencePuzzles)
          .values({ sceneKey: "", puzzleId });
      }),
    ).toBe("23514");
  });
});

describe("spot_difference_differences integrity", () => {
  const region = { x: 0, y: 0, width: 10, height: 10 };

  async function insertDifferences(
    rows: { differenceIndex: number; x?: number; y?: number; width?: number; height?: number }[],
  ) {
    return pgErrorCode(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "spot-difference");
      await tx.insert(spotDifferencePuzzles).values({ ...subtype, puzzleId });
      await tx
        .insert(spotDifferenceDifferences)
        .values(rows.map((row) => ({ ...region, ...row, puzzleId })));
    });
  }

  it.each([
    ["difference_index 15", { differenceIndex: 15 }],
    ["difference_index -1", { differenceIndex: -1 }],
    ["a negative x", { differenceIndex: 0, x: -1 }],
    ["a negative y", { differenceIndex: 0, y: -1 }],
    ["a zero width", { differenceIndex: 0, width: 0 }],
    ["a zero height", { differenceIndex: 0, height: 0 }],
  ])("rejects %s", async (_label, row) => {
    expect(await insertDifferences([row])).toBe("23514");
  });

  it("accepts the indexes 0 and 14, and rejects a duplicate index", async () => {
    expect(
      await insertDifferences([{ differenceIndex: 0 }, { differenceIndex: 14 }]),
    ).toBeUndefined();
    expect(
      await insertDifferences([{ differenceIndex: 0 }, { differenceIndex: 0 }]),
    ).toBe("23505");
  });

  it("rejects a difference for a puzzle that has no subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "spot-difference");
        await tx
          .insert(spotDifferenceDifferences)
          .values({ puzzleId, differenceIndex: 0, ...region });
      }),
    ).toBe("23503");
  });
});

describe("spot-difference module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "sd-test", name: "sd", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "spot-difference",
        categoryKey: "sd-test",
        name: "sd",
        description: "sd",
        subtypeTable: "spot_difference_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "spot-difference",
          slug: "t145-module",
          title: "t145",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await spotDifferenceModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t145mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't145-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds no region", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload).toEqual({
      puzzleId,
      sceneKey: content.sceneKey,
      width: 1600,
      height: 1068,
      differenceCount: differences.length,
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /region|differences"|"x"|"y"|index/i,
    );
  });

  it("rejects a payload that carries a region", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.safeParse({ ...payload, regions: [] }).success).toBe(
      false,
    );
    expect(payloadSchema.safeParse({ ...payload, differences }).success).toBe(
      false,
    );
  });

  it("loads the regions in index order and checks taps against them", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toEqual(
      differences.map((region, index) => ({ index, region })),
    );
    expect(check(payload, solution, { taps: [{ x: 1, y: 1 }] }).correct).toBe(
      false,
    );
  });

  it("re-seeds in place, dropping only the differences past the new list", async () => {
    await db.transaction((tx) =>
      spotDifferenceModule.upsertContent(tx, puzzleId, {
        sceneKey: content.sceneKey,
        differences: differences.slice(0, 3),
      }),
    );
    expect((await loadSolution(puzzleId)).map(({ index }) => index)).toEqual([
      0, 1, 2,
    ]);
    await db.transaction((tx) =>
      spotDifferenceModule.upsertContent(tx, puzzleId, content),
    );
    expect(await loadSolution(puzzleId)).toHaveLength(differences.length);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await spotDifferenceModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      spotDifferenceModule.replaceAttemptState(tx, attempt.id, {
        found: [4, 0, 2],
      }),
    );
    await db.transaction((tx) =>
      spotDifferenceModule.replaceAttemptState(tx, attempt.id, {
        found: [3, 1],
      }),
    );
    expect(await spotDifferenceModule.loadAttemptState(attempt.id)).toEqual({
      found: [1, 3],
    });

    await db.transaction((tx) =>
      spotDifferenceModule.replaceAttemptState(tx, attempt.id, { found: [] }),
    );
    expect(await spotDifferenceModule.loadAttemptState(attempt.id)).toEqual({
      found: [],
    });

    await spotDifferenceModule.clearAttemptState(attempt.id);
    expect(await spotDifferenceModule.loadAttemptState(attempt.id)).toBeNull();
  });

  it("rejects a saved find for a difference the puzzle does not have", async () => {
    const error = await pgError(async (tx) => {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await spotDifferenceModule.replaceAttemptState(tx, attempt.id, {
        found: [differences.length],
      });
    });
    expect(error?.code).toBe("23503");
    expect(error?.message).toMatch(
      /spot_difference_attempt_found_difference_fk/,
    );
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(spotDifferenceAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it("fills puzzle_id on the attempt and the found row from the attempt", async () => {
      const rows = await rolledBack(async (tx) => {
        const attemptId = await startAttempt(tx);
        await tx
          .insert(spotDifferenceAttemptFound)
          .values({ attemptId, differenceIndex: 1 });
        return {
          attempt: await tx
            .select({ puzzleId: spotDifferenceAttempts.puzzleId })
            .from(spotDifferenceAttempts)
            .where(eq(spotDifferenceAttempts.attemptId, attemptId)),
          found: await tx
            .select({ puzzleId: spotDifferenceAttemptFound.puzzleId })
            .from(spotDifferenceAttemptFound)
            .where(eq(spotDifferenceAttemptFound.attemptId, attemptId)),
        };
      });
      expect(rows.attempt).toEqual([{ puzzleId }]);
      expect(rows.found).toEqual([{ puzzleId }]);
    });

    it("accepts a find for an index the puzzle has and rejects one it has not", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values({
            attemptId,
            differenceIndex: differences.length - 1,
          });
        }),
      ).toBeUndefined();
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values({
            attemptId,
            differenceIndex: differences.length,
          });
        }),
      ).toBe("23503");
    });

    it("rejects a duplicate find", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values([
            { attemptId, differenceIndex: 2 },
            { attemptId, differenceIndex: 2 },
          ]);
        }),
      ).toBe("23505");
    });

    it("rejects an explicit puzzle_id that is not the attempt's", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values({
            attemptId,
            puzzleId: crypto.randomUUID(),
            differenceIndex: 0,
          });
        }),
      ).toBe("23503");
    });

    it("rejects deleting a difference that an attempt has found", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId, differenceIndex: 3 });
          await tx
            .delete(spotDifferenceDifferences)
            .where(eq(spotDifferenceDifferences.puzzleId, puzzleId));
        }),
      ).toBe("23503");
    });

    it("rejects a found row with no attempt row", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId: crypto.randomUUID(), differenceIndex: 0 });
        }),
      ).toBe("23502");
    });

    it("rejects a spot-difference attempt for a puzzle of another type", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const other = await insertPuzzle(tx, "other", "t145-wrong");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: other })
            .returning({ id: attempts.id });
          await tx
            .insert(spotDifferenceAttempts)
            .values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
    });

    it("deletes the found rows with their attempt", async () => {
      const remaining = await rolledBack(async (tx) => {
        const attemptId = await startAttempt(tx);
        await tx
          .insert(spotDifferenceAttemptFound)
          .values({ attemptId, differenceIndex: 1 });
        await tx.delete(attempts).where(eq(attempts.id, attemptId));
        return tx
          .select()
          .from(spotDifferenceAttemptFound)
          .where(eq(spotDifferenceAttemptFound.attemptId, attemptId));
      });
      expect(remaining).toHaveLength(0);
    });
  });
});
