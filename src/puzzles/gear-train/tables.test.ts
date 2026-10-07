import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
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
  gearTrainAttemptCogs,
  gearTrainAttempts,
  gearTrainFixedCogs,
  gearTrainInventory,
  gearTrainPuzzles,
  gearTrainSolutionCogs,
  puzzles,
} from "@/db/schema";
import { plantedContent, plantedSolution } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { gearTrainModule } from "./module";
import { payloadSchema } from "./schema";

afterAll(deleteTestUsers);

async function insertPuzzle(tx: Tx, slug: string) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('gt-test', 'gt', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('gear-train', 'gt-test', 'gt', 'gt', 'gear_train_puzzles', 1)
    on conflict (key) do nothing
  `);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey: "gear-train", slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

const fixed = (puzzleId: string) =>
  [
    { puzzleId, role: "driver", row: 3, col: 1, teeth: 8 },
    { puzzleId, role: "target", row: 3, col: 7, teeth: 8 },
  ] as const;

/** A puzzle with both fixed cogs and an inventory of 8 and 16. */
async function withPuzzle(tx: Tx, slug: string) {
  const puzzleId = await insertPuzzle(tx, slug);
  await tx
    .insert(gearTrainPuzzles)
    .values({ puzzleId, rows: 7, cols: 9, targetClockwise: false });
  await tx.insert(gearTrainFixedCogs).values([...fixed(puzzleId)]);
  await tx.insert(gearTrainInventory).values([
    { puzzleId, teeth: 8, count: 2 },
    { puzzleId, teeth: 16, count: 1 },
  ]);
  return puzzleId;
}

describe("both fixed cogs required at commit", () => {
  const commit = (fn: (tx: Tx) => Promise<void>) =>
    db.transaction(fn).then(
      () => undefined,
      (e: { cause?: { code?: string; message?: string } }) => e.cause,
    );

  it("fails when the puzzle has no fixed cogs", async () => {
    const rejected = await commit(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "t082-none");
      await tx
        .insert(gearTrainPuzzles)
        .values({ puzzleId, rows: 7, cols: 9, targetClockwise: false });
    });
    expect(rejected?.code).toBe("23000");
    expect(rejected?.message).toMatch(/needs both a driver and a target/);
  });

  it("fails when only the driver exists", async () => {
    const rejected = await commit(async (tx) => {
      const puzzleId = await insertPuzzle(tx, "t082-driver");
      await tx
        .insert(gearTrainPuzzles)
        .values({ puzzleId, rows: 7, cols: 9, targetClockwise: false });
      await tx.insert(gearTrainFixedCogs).values(fixed(puzzleId)[0]);
    });
    expect(rejected?.code).toBe("23000");
  });

  it("commits with both, whichever order they are inserted in", async () => {
    const slug = "t082-both";
    const committed = await commit(async (tx) => {
      const puzzleId = await insertPuzzle(tx, slug);
      await tx
        .insert(gearTrainPuzzles)
        .values({ puzzleId, rows: 7, cols: 9, targetClockwise: false });
      const [driver, target] = fixed(puzzleId);
      await tx.insert(gearTrainFixedCogs).values(target);
      await tx.insert(gearTrainFixedCogs).values(driver);
    });
    expect(committed).toBeUndefined();
    await db.delete(puzzles).where(eq(puzzles.slug, slug));
  });

  it("rejects removing a fixed cog of an existing puzzle", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await withPuzzle(tx, "t082-remove");
      await forceDeferred(tx);
      await tx
        .delete(gearTrainFixedCogs)
        .where(eq(gearTrainFixedCogs.puzzleId, puzzleId));
      await tx.insert(gearTrainFixedCogs).values(fixed(puzzleId)[0]);
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
  });

  it("allows deleting a whole puzzle", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-delete");
        await forceDeferred(tx);
        await tx.delete(puzzles).where(eq(puzzles.id, puzzleId));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });
});

describe("column checks", () => {
  it("rejects a board outside 4 to 12 and teeth outside 8, 16, 24", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "t082-size");
        await tx
          .insert(gearTrainPuzzles)
          .values({ puzzleId, rows: 13, cols: 9, targetClockwise: true });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-teeth");
        await tx
          .insert(gearTrainInventory)
          .values({ puzzleId, teeth: 12, count: 1 });
      }),
    ).toBe("23514");
  });
});

describe("cogs use a size from the puzzle's inventory", () => {
  it("accepts an inventory size and rejects one that is missing", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-solution-ok");
        await tx
          .insert(gearTrainSolutionCogs)
          .values({ puzzleId, row: 1, col: 1, teeth: 16 });
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-solution-bad");
        await tx
          .insert(gearTrainSolutionCogs)
          .values({ puzzleId, row: 1, col: 1, teeth: 24 });
      }),
    ).toBe("23503");
  });

  it("scopes the size to the puzzle, not to any puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "t082-scope-a");
        const second = await insertPuzzle(tx, "t082-scope-b");
        await tx
          .insert(gearTrainPuzzles)
          .values({
            puzzleId: second,
            rows: 7,
            cols: 9,
            targetClockwise: true,
          });
        await tx.insert(gearTrainFixedCogs).values([...fixed(second)]);
        await tx
          .insert(gearTrainInventory)
          .values({ puzzleId: second, teeth: 24, count: 1 });
        await tx
          .insert(gearTrainSolutionCogs)
          .values({ puzzleId: first, row: 1, col: 1, teeth: 24 });
      }),
    ).toBe("23503");
  });

  it("refuses to drop an inventory size a solution cog uses", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-drop");
        await tx
          .insert(gearTrainSolutionCogs)
          .values({ puzzleId, row: 1, col: 1, teeth: 16 });
        await tx
          .delete(gearTrainInventory)
          .where(eq(gearTrainInventory.teeth, 16));
      }),
    ).toBe("23503");
  });
});

describe("attempt puzzle_id", () => {
  let userId: string;

  async function attemptFor(tx: Tx, puzzleId: string) {
    userId ??= await createTestUser("t082");
    const [attempt] = await tx
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    return attempt.id;
  }

  it("fills gear_train_attempts and gear_train_attempt_cogs from the attempt", async () => {
    const stored = await rolledBack(async (tx) => {
      const puzzleId = await withPuzzle(tx, "t082-fill");
      const attemptId = await attemptFor(tx, puzzleId);
      await tx.insert(gearTrainAttempts).values({ attemptId });
      await tx
        .insert(gearTrainAttemptCogs)
        .values({ attemptId, row: 1, col: 1, teeth: 8 });
      const [attempt] = await tx.select().from(gearTrainAttempts);
      const [cog] = await tx.select().from(gearTrainAttemptCogs);
      return { puzzleId, attempt: attempt.puzzleId, cog: cog.puzzleId };
    });
    expect(stored.attempt).toBe(stored.puzzleId);
    expect(stored.cog).toBe(stored.puzzleId);
  });

  it("rejects an explicit puzzle_id that differs from the attempt's", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "t082-mismatch-a");
        const second = await withPuzzle(tx, "t082-mismatch-b");
        const attemptId = await attemptFor(tx, first);
        await tx
          .insert(gearTrainAttempts)
          .values({ attemptId, puzzleId: second });
      }),
    ).toBe("23503");
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "t082-mismatch-c");
        const second = await withPuzzle(tx, "t082-mismatch-d");
        const attemptId = await attemptFor(tx, first);
        await tx.insert(gearTrainAttempts).values({ attemptId });
        await tx.insert(gearTrainAttemptCogs).values({
          attemptId,
          puzzleId: second,
          row: 1,
          col: 1,
          teeth: 8,
        });
      }),
    ).toBe("23503");
  });

  it("rejects an attempt cog whose size is not in the inventory", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx, "t082-attempt-size");
        const attemptId = await attemptFor(tx, puzzleId);
        await tx.insert(gearTrainAttempts).values({ attemptId });
        await tx
          .insert(gearTrainAttemptCogs)
          .values({ attemptId, row: 1, col: 1, teeth: 24 });
      }),
    ).toBe("23503");
  });
});

describe("module", () => {
  const slug = "t082-module";

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.slug, slug));
    await db.execute(
      sql`delete from puzzle_types where key = 'gear-train' and category_key = 'gt-test'`,
    );
    await db.execute(sql`delete from puzzle_categories where key = 'gt-test'`);
  });

  it("round-trips content, keeps the payload free of the solution and re-seeds in place", async () => {
    const puzzleId = await db.transaction(async (tx) => {
      const id = await insertPuzzle(tx, slug);
      await gearTrainModule.upsertContent(tx, id, plantedContent);
      return id;
    });

    const payload = await load(puzzleId);
    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload).toEqual({
      rows: 7,
      cols: 9,
      targetClockwise: false,
      driver: { row: 3, col: 1, teeth: 8 },
      target: { row: 3, col: 7, teeth: 8 },
      bolts: [
        { row: 2, col: 3 },
        { row: 2, col: 5 },
      ],
      inventory: [{ teeth: 8, count: 4 }],
    });
    for (const key of ["solution", "cogs", "isSolution"]) {
      expect(JSON.stringify(payload)).not.toContain(`"${key}"`);
    }

    const { cogs } = await loadSolution(puzzleId);
    expect(cogs).toHaveLength(4);
    expect(cogs).toEqual(expect.arrayContaining(plantedSolution));

    await db.transaction((tx) =>
      gearTrainModule.upsertContent(tx, puzzleId, {
        ...plantedContent,
        inventory: [{ teeth: 8, count: 5 }],
      }),
    );
    expect((await load(puzzleId)).inventory).toEqual([{ teeth: 8, count: 5 }]);
  });
});
