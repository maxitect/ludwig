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
  spotDifferencePuzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { spotDifferenceModule } from "./module";
import { payloadSchema } from "./schema";

const content = { sceneSeed: 1902, differenceCount: 6, generatorVersion: 1 };

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
  it("stores only the seed, count and version", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_name = 'spot_difference_puzzles' order by ordinal_position
    `);
    expect(rows.rows.map((row) => row.column_name)).toEqual([
      "puzzle_id",
      "type_key",
      "scene_seed",
      "difference_count",
      "generator_version",
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
        await tx.insert(spotDifferencePuzzles).values({ ...content, puzzleId });
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
        await tx.insert(spotDifferencePuzzles).values({ ...content, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["difference_count 0", { differenceCount: 0 }],
    ["difference_count 16", { differenceCount: 16 }],
    ["generator_version 0", { generatorVersion: 0 }],
    ["a negative scene_seed", { sceneSeed: -1 }],
  ])("rejects %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "spot-difference");
        await tx
          .insert(spotDifferencePuzzles)
          .values({ ...content, ...override, puzzleId });
      }),
    ).toBe("23514");
  });

  it("accepts the bounds 1 and 15, and version 1", async () => {
    for (const differenceCount of [1, 15]) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertPuzzle(tx, "spot-difference");
          await tx
            .insert(spotDifferencePuzzles)
            .values({ ...content, differenceCount, puzzleId });
        }),
      ).toBeUndefined();
    }
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
          slug: "t061-module",
          title: "t061",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await spotDifferenceModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t061mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't061-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds no seed, version or region", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.differenceCount).toBe(content.differenceCount);
    const text = JSON.stringify(payload);
    expect(text).not.toMatch(
      /sceneSeed|generatorVersion|region|index|differences/i,
    );
    expect(Object.keys(payload).sort()).toEqual([
      "differenceCount",
      "puzzleId",
      "scenes",
    ]);
  });

  it("rejects a payload that carries a seed or a region", async () => {
    const payload = await load(puzzleId);
    expect(
      payloadSchema.safeParse({ ...payload, sceneSeed: content.sceneSeed })
        .success,
    ).toBe(false);
    expect(
      payloadSchema.safeParse({ ...payload, regions: [] }).success,
    ).toBe(false);
  });

  it("loads the solution and checks taps against the derived regions", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toEqual(content);
    expect(check(payload, solution, { taps: [{ x: 1, y: 1 }] }).correct).toBe(
      false,
    );
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

  it("rejects a saved found difference beyond the puzzle's count", async () => {
    const error = await pgError(async (tx) => {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await spotDifferenceModule.replaceAttemptState(tx, attempt.id, {
        found: [content.differenceCount],
      });
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/beyond the puzzle's count/);
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

    it("rejects a found index outside 0 to 14 and a duplicate", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId, differenceIndex: 15 });
        }),
      ).toBe("23514");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(spotDifferenceAttemptFound)
            .values([
              { attemptId, differenceIndex: 2 },
              { attemptId, differenceIndex: 2 },
            ]);
        }),
      ).toBe("23505");
    });

    it("accepts the last index and rejects one at the puzzle's count", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values({
            attemptId,
            differenceIndex: content.differenceCount - 1,
          });
        }),
      ).toBeUndefined();
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(spotDifferenceAttemptFound).values({
            attemptId,
            differenceIndex: content.differenceCount,
          });
        }),
      ).toBe("23000");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId, differenceIndex: 0 });
          await tx
            .update(spotDifferenceAttemptFound)
            .set({ differenceIndex: content.differenceCount })
            .where(eq(spotDifferenceAttemptFound.attemptId, attemptId));
        }),
      ).toBe("23000");
    });

    it("rejects lowering a puzzle's count below a found difference, and allows it above", async () => {
      const lowerTo = async (differenceCount: number) =>
        pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId, differenceIndex: 3 });
          await tx
            .update(spotDifferencePuzzles)
            .set({ differenceCount })
            .where(eq(spotDifferencePuzzles.puzzleId, puzzleId));
        });
      expect(await lowerTo(3)).toBe("23000");
      expect(await lowerTo(4)).toBeUndefined();
    });

    it("rejects a found row with no attempt row", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          await tx
            .insert(spotDifferenceAttemptFound)
            .values({ attemptId: crypto.randomUUID(), differenceIndex: 0 });
        }),
      ).toBe("23503");
    });

    it("rejects a spot-difference attempt for a puzzle of another type", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const other = await insertPuzzle(tx, "other", "t061-wrong");
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
