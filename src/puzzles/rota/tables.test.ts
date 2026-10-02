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
  puzzles,
  rotaAttemptSwaps,
  rotaAttempts,
  rotaClueMaxSwaps,
  rotaClueNeverInRank,
  rotaClueUnpoweredSquare,
  rotaClues,
  rotaPuzzles,
  rotaSolutionSwaps,
  rotaSolutions,
  rotaWorkerSquares,
  rotaWorkers,
} from "@/db/schema";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { rotaModule } from "./module";
import { contentSchema, payloadSchema } from "./schema";

afterAll(deleteTestUsers);

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('rota-test', 'rt', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('rota', 'rota-test', 'rota', 'rota', 'rota_puzzles', 1),
           ('anagram', 'rota-test', 'an', 'an', 'anagram_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey = "rota", slug = "one") {
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

async function insertWorker(tx: Tx, puzzleId: string, name: string) {
  const [row] = await tx
    .insert(rotaWorkers)
    .values({ puzzleId, name })
    .returning({ id: rotaWorkers.id });
  return row.id;
}

async function withPuzzle(tx: Tx, slug = "one") {
  await ensureTypes(tx);
  const puzzleId = await insertPuzzle(tx, "rota", slug);
  await tx.insert(rotaPuzzles).values({ puzzleId });
  const marty = await insertWorker(tx, puzzleId, "Marty");
  const gary = await insertWorker(tx, puzzleId, "Gary");
  return { puzzleId, marty, gary };
}

async function insertClue(
  tx: Tx,
  puzzleId: string,
  kind: typeof rotaClues.$inferInsert.kind,
  position = 0,
) {
  const [row] = await tx
    .insert(rotaClues)
    .values({ puzzleId, kind, position, displayText: "clue" })
    .returning({ id: rotaClues.id });
  return row.id;
}

describe("rota clue subtype pinning", () => {
  it("rejects a max_swaps row for an unpowered_square clue", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        const clueId = await insertClue(tx, puzzleId, "unpowered_square");
        await tx.insert(rotaClueMaxSwaps).values({ clueId, maxSwaps: 2 });
      }),
    ).toBe("23503");
  });

  it("accepts each subtype on a clue of its own kind", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId, gary } = await withPuzzle(tx);
        const square = await insertClue(tx, puzzleId, "unpowered_square", 0);
        const maxSwaps = await insertClue(tx, puzzleId, "max_swaps", 1);
        const never = await insertClue(tx, puzzleId, "never_in_rank", 2);
        await insertClue(tx, puzzleId, "adjacent_only", 3);
        await tx
          .insert(rotaClueUnpoweredSquare)
          .values({ clueId: square, file: "g", rank: 5 });
        await tx
          .insert(rotaClueMaxSwaps)
          .values({ clueId: maxSwaps, maxSwaps: 2 });
        await tx
          .insert(rotaClueNeverInRank)
          .values({ clueId: never, workerId: gary, rank: 1 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("is generated as the enum kind with a cascading composite FK", async () => {
    const { rows } = await db.execute(sql`
      select
        (select generation_expression from information_schema.columns
          where table_name = 'rota_clue_max_swaps' and column_name = 'kind') as expr,
        (select pg_get_constraintdef(oid) from pg_constraint
          where conname = 'rota_clue_max_swaps_clue_id_kind_fk') as fk
    `);
    expect(rows[0].expr).toBe("'max_swaps'::rota_clue_kind");
    expect(rows[0].fk).toBe(
      "FOREIGN KEY (clue_id, kind) REFERENCES rota_clues(id, kind) ON DELETE CASCADE",
    );
  });
});

describe("trg_rota_clues_require_subtype", () => {
  it("rejects a parameterised clue without its subtype row at commit", async () => {
    for (const kind of [
      "unpowered_square",
      "never_in_rank",
      "max_swaps",
    ] as const) {
      const error = await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        await insertClue(tx, puzzleId, kind);
        await forceDeferred(tx);
      });
      expect(error?.code).toBe("23000");
      expect(error?.message).toContain("has no subtype row");
    }
  });

  it("commits an adjacent_only clue without a subtype row", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        await insertClue(tx, puzzleId, "adjacent_only");
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("accepts the subtype row inserted after the clue in the same transaction", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        const clueId = await insertClue(tx, puzzleId, "max_swaps");
        await tx.insert(rotaClueMaxSwaps).values({ clueId, maxSwaps: 3 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("does not fire for a clue deleted in the same transaction", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId } = await withPuzzle(tx);
        const clueId = await insertClue(tx, puzzleId, "max_swaps");
        await tx.delete(rotaClues).where(eq(rotaClues.id, clueId));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });
});

describe("rota_clue_never_in_rank puzzle_id", () => {
  it("is filled from the clue when omitted", async () => {
    const stored = await rolledBack(async (tx) => {
      const { puzzleId, gary } = await withPuzzle(tx);
      const clueId = await insertClue(tx, puzzleId, "never_in_rank");
      await tx
        .insert(rotaClueNeverInRank)
        .values({ clueId, workerId: gary, rank: 1 });
      const [row] = await tx
        .select({ puzzleId: rotaClueNeverInRank.puzzleId })
        .from(rotaClueNeverInRank)
        .where(eq(rotaClueNeverInRank.clueId, clueId));
      return { filled: row.puzzleId, expected: puzzleId };
    });
    expect(stored.filled).toBe(stored.expected);
  });

  it("rejects an explicit puzzle_id that differs from the clue", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const clueId = await insertClue(tx, first.puzzleId, "never_in_rank");
        await tx.insert(rotaClueNeverInRank).values({
          clueId,
          puzzleId: second.puzzleId,
          workerId: second.gary,
          rank: 1,
        });
      }),
    ).toBe("23503");
  });

  it("rejects a worker of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const clueId = await insertClue(tx, first.puzzleId, "never_in_rank");
        await tx
          .insert(rotaClueNeverInRank)
          .values({ clueId, workerId: second.gary, rank: 1 });
      }),
    ).toBe("23503");
  });
});

describe("cross-puzzle worker references", () => {
  it("rejects a solution swap with a worker of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(rotaSolutions).values({
          puzzleId: first.puzzleId,
          instigatorWorkerId: first.marty,
        });
        await tx.insert(rotaSolutionSwaps).values({
          puzzleId: first.puzzleId,
          step: 1,
          workerAId: first.marty,
          workerBId: second.gary,
        });
      }),
    ).toBe("23503");
  });

  it("rejects an instigator of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(rotaSolutions).values({
          puzzleId: first.puzzleId,
          instigatorWorkerId: second.marty,
        });
      }),
    ).toBe("23503");
  });

  it("accepts a swap between workers of the same puzzle", async () => {
    expect(
      await pgError(async (tx) => {
        const { puzzleId, marty, gary } = await withPuzzle(tx);
        await tx
          .insert(rotaSolutions)
          .values({ puzzleId, instigatorWorkerId: marty });
        await tx.insert(rotaSolutionSwaps).values({
          puzzleId,
          step: 1,
          workerAId: marty,
          workerBId: gary,
        });
      }),
    ).toBeUndefined();
  });

  it("rejects a swap of a worker with itself", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, marty } = await withPuzzle(tx);
        await tx
          .insert(rotaSolutions)
          .values({ puzzleId, instigatorWorkerId: marty });
        await tx.insert(rotaSolutionSwaps).values({
          puzzleId,
          step: 1,
          workerAId: marty,
          workerBId: marty,
        });
      }),
    ).toBe("23514");
  });

  it("rejects two workers on the same square in one phase", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, marty, gary } = await withPuzzle(tx);
        await tx.insert(rotaWorkerSquares).values([
          { puzzleId, workerId: marty, phase: "final", file: "a", rank: 1 },
          { puzzleId, workerId: gary, phase: "final", file: "a", rank: 1 },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects a worker square for a worker of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        await tx.insert(rotaWorkerSquares).values({
          puzzleId: first.puzzleId,
          workerId: second.marty,
          phase: "final",
          file: "a",
          rank: 1,
        });
      }),
    ).toBe("23503");
  });
});

describe("rota attempts puzzle_id", () => {
  let userId: string;

  async function attemptFor(tx: Tx, puzzleId: string) {
    userId ??= await createTestUser("t062");
    const [attempt] = await tx
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    return attempt;
  }

  it("fills attempt and swap puzzle_id when omitted", async () => {
    const stored = await rolledBack(async (tx) => {
      const { puzzleId, marty, gary } = await withPuzzle(tx);
      const attempt = await attemptFor(tx, puzzleId);
      await tx.insert(rotaAttempts).values({ attemptId: attempt.id });
      await tx.insert(rotaAttemptSwaps).values({
        attemptId: attempt.id,
        step: 1,
        workerAId: marty,
        workerBId: gary,
      });
      const [swap] = await tx
        .select({ puzzleId: rotaAttemptSwaps.puzzleId })
        .from(rotaAttemptSwaps)
        .where(eq(rotaAttemptSwaps.attemptId, attempt.id));
      const [row] = await tx
        .select({ puzzleId: rotaAttempts.puzzleId })
        .from(rotaAttempts)
        .where(eq(rotaAttempts.attemptId, attempt.id));
      return { swap: swap.puzzleId, attempt: row.puzzleId, expected: puzzleId };
    });
    expect(stored.attempt).toBe(stored.expected);
    expect(stored.swap).toBe(stored.expected);
  });

  it("rejects an explicit puzzle_id that differs from the attempt", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const attempt = await attemptFor(tx, first.puzzleId);
        await tx.insert(rotaAttempts).values({
          attemptId: attempt.id,
          puzzleId: second.puzzleId,
        });
      }),
    ).toBe("23503");
  });

  it("rejects an attempt of another puzzle type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await ensureTypes(tx);
        const attempt = await attemptFor(tx, await insertPuzzle(tx, "anagram"));
        await tx.insert(rotaAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a swap of another puzzle's worker", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await withPuzzle(tx, "one");
        const second = await withPuzzle(tx, "two");
        const attempt = await attemptFor(tx, first.puzzleId);
        await tx.insert(rotaAttempts).values({ attemptId: attempt.id });
        await tx.insert(rotaAttemptSwaps).values({
          attemptId: attempt.id,
          step: 1,
          workerAId: first.marty,
          workerBId: second.gary,
        });
      }),
    ).toBe("23503");
  });

  it("replaceAttemptState replaces the rows instead of appending", async () => {
    const swaps = await rolledBack(async (tx) => {
      const { puzzleId, marty, gary } = await withPuzzle(tx);
      const attempt = await attemptFor(tx, puzzleId);
      const swap = { workerAId: marty, workerBId: gary };
      await rotaModule.replaceAttemptState(tx, attempt.id, {
        instigatorWorkerId: marty,
        swaps: [swap, swap],
      });
      await rotaModule.replaceAttemptState(tx, attempt.id, {
        instigatorWorkerId: null,
        swaps: [swap],
      });
      return tx
        .select({ step: rotaAttemptSwaps.step })
        .from(rotaAttemptSwaps)
        .where(eq(rotaAttemptSwaps.attemptId, attempt.id));
    });
    expect(swaps).toEqual([{ step: 1 }]);
  });
});

describe("play payload", () => {
  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.slug, "t062-leak-test"));
    await db.execute(
      sql`delete from puzzle_types where key in ('rota', 'anagram') and category_key = 'rota-test'`,
    );
    await db.execute(sql`delete from puzzle_categories where key = 'rota-test'`);
  });

  it("contains no solution data", async () => {
    const content = contentSchema.parse({
      workers: [
        { name: "Marty", intended: { file: "a", rank: 1 }, final: { file: "a", rank: 2 } },
        { name: "Gary", intended: { file: "a", rank: 2 }, final: { file: "a", rank: 1 } },
      ],
      clues: [
        { displayText: "Only neighbours swap", kind: "adjacent_only" },
        { displayText: "G8 had no power", kind: "unpowered_square", file: "g", rank: 8 },
        { displayText: "Gary never worked row 5", kind: "never_in_rank", workerName: "Gary", rank: 5 },
        { displayText: "One swap at most", kind: "max_swaps", maxSwaps: 1 },
      ],
      solution: {
        instigatorName: "Marty",
        swaps: [{ a: "Marty", b: "Gary" }],
      },
    });
    const puzzleId = await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const id = await insertPuzzle(tx, "rota", "t062-leak-test");
      await rotaModule.insertContent(tx, id, content);
      return id;
    });

    const payload = await load(puzzleId);

    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload.workers).toHaveLength(2);
    expect(payload.clues.map((clue) => clue.kind)).toEqual([
      "adjacent_only",
      "unpowered_square",
      "never_in_rank",
      "max_swaps",
    ]);
    for (const key of ["instigator", "swaps\":[{\"workerAId", "step"]) {
      expect(JSON.stringify(payload)).not.toContain(key);
    }
    expect(
      payloadSchema
        .strict()
        .safeParse({ ...payload, instigatorWorkerId: "x" }).success,
    ).toBe(false);

    const solution = await loadSolution(puzzleId);
    const marty = payload.workers.find((worker) => worker.name === "Marty");
    expect(solution.instigatorWorkerId).toBe(marty?.id);
    expect(solution.swaps).toHaveLength(1);
    expect(
      rotaModule.check(payload, solution, {
        instigatorWorkerId: solution.instigatorWorkerId,
        swaps: solution.swaps,
      }),
    ).toEqual({ correct: true });
  });
});
