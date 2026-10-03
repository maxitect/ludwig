import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
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
  gearAttemptSwaps,
  gearAttempts,
  gearMeshes,
  gearPuzzleGears,
  gearPuzzles,
  gearSolutionSwaps,
  gearSolutions,
  puzzles,
} from "@/db/schema";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { gearsModule } from "./module";
import { contentSchema, payloadSchema } from "./schema";

afterAll(deleteTestUsers);

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('gear-test', 'gt', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('gears', 'gear-test', 'gears', 'gears', 'gear_puzzles', 1),
           ('anagram', 'gear-test', 'an', 'an', 'anagram_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey = "gears", slug = "one") {
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

const subtype = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  maxAdjustments: 0,
  occlusion: false,
} as const;

let gearCount = 0;
async function insertGear(
  tx: Tx,
  puzzleId: string,
  overrides: Partial<typeof gearPuzzleGears.$inferInsert> = {},
) {
  gearCount += 1;
  const [row] = await tx
    .insert(gearPuzzleGears)
    .values({
      puzzleId,
      label: `g${gearCount}`,
      teeth: 12,
      startSlot: 0,
      initialOffset: 0,
      halfWidthDeg: 45,
      isDriver: false,
      ...overrides,
    })
    .returning({ id: gearPuzzleGears.id });
  return row.id;
}

/** A gear puzzle with a driver and one more gear. */
async function withPuzzle(tx: Tx, slug = "one") {
  await ensureTypes(tx);
  const puzzleId = await insertPuzzle(tx, "gears", slug);
  await tx.insert(gearPuzzles).values({ ...subtype, puzzleId });
  const driverId = await insertGear(tx, puzzleId, { isDriver: true });
  const otherId = await insertGear(tx, puzzleId);
  return { puzzleId, driverId, otherId };
}

const ordered = (a: string, b: string) =>
  a < b ? { gearAId: a, gearBId: b } : { gearAId: b, gearBId: a };

describe("gear_puzzles pinning", () => {
  it("is generated as gears with a cascading composite FK", async () => {
    const { rows } = await db.execute(sql`
      select
        (select generation_expression from information_schema.columns
          where table_name = 'gear_puzzles' and column_name = 'type_key') as expr,
        (select pg_get_constraintdef(oid) from pg_constraint
          where conname = 'gear_puzzles_puzzle_id_type_key_fk') as fk
    `);
    expect(rows[0].expr).toBe("'gears'::text");
    expect(rows[0].fk).toBe(
      "FOREIGN KEY (puzzle_id, type_key) REFERENCES puzzles(id, type_key) ON DELETE CASCADE",
    );
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await ensureTypes(tx);
        const puzzleId = await insertPuzzle(tx, "anagram");
        await tx.insert(gearPuzzles).values({ ...subtype, puzzleId });
      }),
    ).toBe("23503");
  });
});

describe("gear_puzzle_gears teeth", () => {
  it("rejects 10 teeth", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        await insertGear(tx, puzzleId, { teeth: 10 });
      }),
    ).toBe("23514");
  });

  it.each([8, 12, 16, 24])("accepts %i teeth", async (teeth) => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        await insertGear(tx, puzzleId, { teeth });
      }),
    ).toBeUndefined();
  });
});

describe("one driver per puzzle", () => {
  it("rejects a second driver", async () => {
    const error = await pgError(async (tx) => {
      const { puzzleId } = await withPuzzle(tx);
      await insertGear(tx, puzzleId, { isDriver: true });
    });
    expect(error?.code).toBe("23505");
    expect(error?.message).toMatch(/gear_puzzle_gears_one_driver_idx/);
  });

  it("allows a driver in each of two puzzles", async () => {
    expect(
      await pgError(async (tx) => {
        await withPuzzle(tx, "one");
        await withPuzzle(tx, "two");
      }),
    ).toBeUndefined();
  });
});

describe("driver required at commit", () => {
  const driverlessPuzzle = async (tx: Tx) => {
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx);
    await tx.insert(gearPuzzles).values({ ...subtype, puzzleId });
    await insertGear(tx, puzzleId);
    await insertGear(tx, puzzleId);
    await insertGear(tx, puzzleId);
    return puzzleId;
  };

  it("rejects a puzzle with no driver when the transaction commits", async () => {
    const error = await db
      .transaction(async (tx) => {
        await driverlessPuzzle(tx);
      })
      .then(
        () => undefined,
        (e: { cause?: { code?: string; message?: string } }) => e.cause,
      );
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no driver gear/);
  });

  it("accepts a driver inserted last, proving the check is deferred", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await driverlessPuzzle(tx);
        await insertGear(tx, puzzleId, { isDriver: true });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects removing the driver of an existing puzzle", async () => {
    const error = await pgError(async (tx) => {
      const { puzzleId, driverId } = await withPuzzle(tx);
      await forceDeferred(tx);
      await tx.delete(gearPuzzleGears).where(eq(gearPuzzleGears.id, driverId));
      await forceDeferred(tx);
      expect(puzzleId).toBeDefined();
    });
    expect(error?.code).toBe("23000");
  });

  it("allows deleting a whole puzzle with its driver", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        await forceDeferred(tx);
        await tx.delete(puzzles).where(eq(puzzles.id, puzzleId));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });
});

describe("gear_meshes", () => {
  it("accepts a mesh between two gears of one puzzle", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId, driverId, otherId } = await withPuzzle(tx);
        await tx
          .insert(gearMeshes)
          .values({ puzzleId, ...ordered(driverId, otherId) });
      }),
    ).toBeUndefined();
  });

  it("rejects a mesh across two puzzles", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(gearMeshes).values({
          puzzleId: first.puzzleId,
          ...ordered(first.driverId, second.driverId),
        });
      }),
    ).toBe("23503");
  });

  it("rejects gear_a_id greater than gear_b_id", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, driverId, otherId } = await withPuzzle(tx);
        const { gearAId, gearBId } = ordered(driverId, otherId);
        await tx
          .insert(gearMeshes)
          .values({ puzzleId, gearAId: gearBId, gearBId: gearAId });
      }),
    ).toBe("23514");
  });
});

describe("gear_solutions", () => {
  it("accepts a killer of the same puzzle and convergence 1 to 8", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId, otherId } = await withPuzzle(tx);
        await tx.insert(gearSolutions).values({
          puzzleId,
          crank: 5,
          convergence: 8,
          killerGearId: otherId,
        });
      }),
    ).toBeUndefined();
  });

  it("rejects a killer from another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(gearSolutions).values({
          puzzleId: first.puzzleId,
          crank: 0,
          convergence: 1,
          killerGearId: second.otherId,
        });
      }),
    ).toBe("23503");
  });

  it("rejects convergence 9", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, otherId } = await withPuzzle(tx);
        await tx.insert(gearSolutions).values({
          puzzleId,
          crank: 0,
          convergence: 9,
          killerGearId: otherId,
        });
      }),
    ).toBe("23514");
  });

  it("rejects a solution swap with a gear of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(gearSolutions).values({
          puzzleId: first.puzzleId,
          crank: 0,
          convergence: 1,
          killerGearId: first.otherId,
        });
        await tx.insert(gearSolutionSwaps).values({
          puzzleId: first.puzzleId,
          ...ordered(first.driverId, second.driverId),
        });
      }),
    ).toBe("23503");
  });
});

describe("gear_attempts puzzle_id", () => {
  let userId: string;

  async function attemptFor(tx: Tx, puzzleId: string) {
    userId ??= await createTestUser("t033");
    const [attempt] = await tx
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id, puzzleId: attempts.puzzleId });
    return attempt;
  }

  it("is filled from the attempt when omitted", async () => {
    const stored = await pgErrorOrRows(async (tx) => {
      const { puzzleId } = await withPuzzle(tx);
      const attempt = await attemptFor(tx, puzzleId);
      await tx.insert(gearAttempts).values({ attemptId: attempt.id, crank: 3 });
      const [row] = await tx
        .select({ puzzleId: gearAttempts.puzzleId })
        .from(gearAttempts)
        .where(eq(gearAttempts.attemptId, attempt.id));
      return { filled: row.puzzleId, expected: puzzleId };
    });
    expect(stored.filled).toBe(stored.expected);
  });

  it("rejects an explicit puzzle_id that differs from the attempt", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const attempt = await attemptFor(tx, first.puzzleId);
        await tx.insert(gearAttempts).values({
          attemptId: attempt.id,
          puzzleId: second.puzzleId,
          crank: 0,
        });
      }),
    ).toBe("23503");
  });

  it("rejects an attempt of another puzzle type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await ensureTypes(tx);
        const attempt = await attemptFor(tx, await insertPuzzle(tx, "anagram"));
        await tx
          .insert(gearAttempts)
          .values({ attemptId: attempt.id, crank: 0 });
      }),
    ).toBe("23503");
  });

  it("rejects an accused gear from another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const attempt = await attemptFor(tx, first.puzzleId);
        await tx.insert(gearAttempts).values({
          attemptId: attempt.id,
          crank: 0,
          convergence: 2,
          accusedGearId: second.otherId,
        });
      }),
    ).toBe("23503");
  });

  it("fills swap puzzle_id and rejects swaps of another puzzle's gears", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId, driverId, otherId } = await withPuzzle(tx);
        const attempt = await attemptFor(tx, puzzleId);
        await tx
          .insert(gearAttempts)
          .values({ attemptId: attempt.id, crank: 0 });
        await tx
          .insert(gearAttemptSwaps)
          .values({ attemptId: attempt.id, ...ordered(driverId, otherId) });
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const attempt = await attemptFor(tx, first.puzzleId);
        await tx
          .insert(gearAttempts)
          .values({ attemptId: attempt.id, crank: 0 });
        await tx.insert(gearAttemptSwaps).values({
          attemptId: attempt.id,
          ...ordered(first.driverId, second.driverId),
        });
      }),
    ).toBe("23503");
  });
});

describe("play payload", () => {
  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.slug, "t033-leak-test"));
    await db.execute(
      sql`delete from puzzle_types where key in ('gears', 'anagram') and category_key = 'gear-test'`,
    );
    await db.execute(sql`delete from puzzle_categories where key = 'gear-test'`);
  });

  it("contains no solution data", async () => {
    const content = contentSchema.parse({
      ...subtype,
      maxAdjustments: 1,
      gears: [
        {
          label: "A",
          teeth: 12,
          startSlot: 0,
          initialOffset: 0,
          halfWidthDeg: 45,
          isDriver: true,
        },
        {
          label: "B",
          teeth: 8,
          startSlot: 3,
          initialOffset: 2,
          halfWidthDeg: 45,
          isDriver: false,
        },
      ],
      meshes: [{ a: "B", b: "A" }],
      solution: {
        crank: 7,
        convergence: 4,
        killerLabel: "B",
        swaps: [{ a: "B", b: "A" }],
      },
    });
    const puzzleId = await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const id = await insertPuzzle(tx, "gears", "t033-leak-test");
      await gearsModule.upsertContent(tx, id, content);
      return id;
    });

    const payload = await load(puzzleId);

    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload.gears).toHaveLength(2);
    expect(payload.meshes).toHaveLength(1);
    for (const key of [
      "crank",
      "convergence",
      "killer",
      "killerGearId",
      "swaps",
      "generatorSeed",
    ]) {
      expect(JSON.stringify(payload)).not.toContain(`"${key}`);
    }
    expect(
      payloadSchema.strict().safeParse({ ...payload, crank: 7 }).success,
    ).toBe(false);

    const solution = await loadSolution(puzzleId);
    const killer = payload.gears.find((gear) => gear.label === "B");
    expect(solution).toMatchObject({ crank: 7, convergence: 4 });
    expect(solution.killerGearId).toBe(killer?.id);
    expect(solution.swaps).toHaveLength(1);
  });
});

/** Runs `fn` in a rolled-back transaction, returning its result and failing on any Postgres error. */
async function pgErrorOrRows<T>(fn: (tx: Tx) => Promise<T>) {
  let result!: T;
  const error = await pgError(async (tx) => {
    result = await fn(tx);
  });
  expect(error).toBeUndefined();
  return result;
}
