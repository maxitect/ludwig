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
  oddOneOutAttempts,
  oddOneOutItems,
  oddOneOutPuzzles,
  oddOneOutSolutions,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { oddOneOutModule } from "./module";
import { payloadSchema, type Content } from "./schema";

const content: Content = {
  promptText: "Which is the odd one out?",
  items: ["Violin", "Cello", "Trumpet", "Harp"],
  solution: { itemPosition: 2, explanation: "The trumpet is brass." },
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('oo-test', 'oo', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('odd-one-out', 'oo-test', 'oo', 'oo', 'odd_one_out_puzzles', 1),
           ('other', 'oo-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertOdd(tx: Tx, slug = "one") {
  const puzzleId = await insertPuzzle(tx, "odd-one-out", slug);
  await tx.insert(oddOneOutPuzzles).values({ puzzleId, promptText: "q" });
  await tx.insert(oddOneOutItems).values(
    ["A", "B", "C", "D"].map((label, position) => ({
      puzzleId,
      position,
      label,
    })),
  );
  return puzzleId;
}

async function insertAttempt(
  tx: Pick<Tx, "insert">,
  userId: string,
  puzzleId: string,
) {
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  return attempt.id;
}

describe("odd one out tables", () => {
  it("stores no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'odd_one_out%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("accepts a solution that names an item of the puzzle", async () => {
    await rolledBack(async (tx) => {
      const puzzleId = await insertOdd(tx);
      await tx
        .insert(oddOneOutSolutions)
        .values({ puzzleId, itemPosition: 3, explanation: "Because." });
      await forceDeferred(tx);
    });
  });

  it("rejects a solution that points at an item that does not exist", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await insertOdd(tx);
      await tx
        .insert(oddOneOutSolutions)
        .values({ puzzleId, itemPosition: 9, explanation: "Because." });
    });
    expect(error?.code).toBe("23503");
    expect(error?.message).toMatch(/odd_one_out_solutions_item_fk/);
  });

  it("rejects a solution that points at an item of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertOdd(tx, "first");
        const second = await insertPuzzle(tx, "odd-one-out", "second");
        await tx
          .insert(oddOneOutPuzzles)
          .values({ puzzleId: second, promptText: "q" });
        await tx
          .insert(oddOneOutItems)
          .values({ puzzleId: second, position: 0, label: "Only" });
        await tx
          .insert(oddOneOutSolutions)
          .values({ puzzleId: second, itemPosition: 3, explanation: "x" });
      }),
    ).toBe("23503");
  });

  it("allows one solution row per puzzle and a non-blank explanation", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertOdd(tx);
        await tx
          .insert(oddOneOutSolutions)
          .values({ puzzleId, itemPosition: 0, explanation: "one" });
        await tx
          .insert(oddOneOutSolutions)
          .values({ puzzleId, itemPosition: 1, explanation: "two" });
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertOdd(tx);
        await tx
          .insert(oddOneOutSolutions)
          .values({ puzzleId, itemPosition: 0, explanation: "   " });
      }),
    ).toBe("23514");
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(oddOneOutPuzzles).values({ puzzleId, promptText: "q" });
      }),
    ).toBe("23503");
  });

  it("rejects an odd one out puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "odd-one-out");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in odd_one_out_puzzles/);
  });

  it("rejects a sixth position and a repeated label at commit", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertOdd(tx);
        await tx
          .insert(oddOneOutItems)
          .values({ puzzleId, position: 5, label: "F" });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertOdd(tx);
        await tx
          .insert(oddOneOutItems)
          .values({ puzzleId, position: 4, label: "A" });
        await forceDeferred(tx);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t056tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const attemptId = await insertAttempt(tx, userId, puzzleId);
        await tx.insert(oddOneOutAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });

  it("fills the puzzle id of an attempt from the attempt and keeps item_position optional", async () => {
    const userId = await createTestUser("t056fill");
    const { puzzleId, attempt } = await rolledBack(async (tx) => {
      const puzzleId = await insertOdd(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(oddOneOutAttempts).values({ attemptId });
      await forceDeferred(tx);
      const [attempt] = await tx.select().from(oddOneOutAttempts);
      return { puzzleId, attempt };
    });
    expect(attempt.puzzleId).toBe(puzzleId);
    expect(attempt.itemPosition).toBeNull();
  });

  it("rejects an attempt that picks an item the puzzle does not have, at commit", async () => {
    const userId = await createTestUser("t056pick");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertOdd(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(oddOneOutAttempts).values({ attemptId, itemPosition: 7 });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });
});

describe("odd one out module", () => {
  let puzzleId: string;
  let attemptId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "oo-test", name: "oo", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "odd-one-out",
        categoryKey: "oo-test",
        name: "oo",
        description: "oo",
        subtypeTable: "odd_one_out_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "odd-one-out",
          slug: "t056-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await oddOneOutModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    attemptId = await insertAttempt(
      db,
      await createTestUser("t056mod"),
      puzzleId,
    );
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the items with no solution and no explanation", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload).toEqual({
      promptText: "Which is the odd one out?",
      items: [
        { position: 0, label: "Violin" },
        { position: 1, label: "Cello" },
        { position: 2, label: "Trumpet" },
        { position: 3, label: "Harp" },
      ],
    });
    expect(JSON.stringify(payload)).not.toMatch(/brass|explanation|solution/i);
    expect(
      payloadSchema
        .strict()
        .safeParse({ ...payload, explanation: "The trumpet is brass." })
        .success,
    ).toBe(false);
    expect(
      payloadSchema
        .strict()
        .safeParse({
          ...payload,
          items: [{ ...payload.items[0], itemPosition: 2 }],
        }).success,
    ).toBe(false);
  });

  it("checks answers against the stored item and gives the explanation only when right", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toEqual({
      itemPosition: 2,
      explanation: "The trumpet is brass.",
    });
    expect(check(payload, solution, { itemPosition: 2 })).toEqual({
      correct: true,
      epilogue: "The trumpet is brass.",
    });
    expect(check(payload, solution, { itemPosition: 0 })).toEqual({
      correct: false,
    });
  });

  it("updates in place, swaps labels and drops an item the content no longer has", async () => {
    await db.transaction((tx) =>
      oddOneOutModule.upsertContent(tx, puzzleId, {
        ...content,
        items: ["Cello", "Violin", "Trumpet", "Harp"],
        solution: { itemPosition: 2, explanation: "Still brass." },
      }),
    );
    expect((await load(puzzleId)).items.map(({ label }) => label)).toEqual([
      "Cello",
      "Violin",
      "Trumpet",
      "Harp",
    ]);
    expect((await loadSolution(puzzleId)).explanation).toBe("Still brass.");
    await db.transaction((tx) =>
      oddOneOutModule.upsertContent(tx, puzzleId, {
        ...content,
        items: ["Cello", "Violin", "Trumpet"],
      }),
    );
    expect(await load(puzzleId)).toMatchObject({
      items: [{ label: "Cello" }, { label: "Violin" }, { label: "Trumpet" }],
    });
    await db.transaction((tx) =>
      oddOneOutModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).items.map(({ label }) => label)).toEqual(
      content.items,
    );
  });

  it("replaces, reads back and clears the attempt state", async () => {
    expect(await oddOneOutModule.loadAttemptState(attemptId)).toBeNull();
    await db.transaction((tx) =>
      oddOneOutModule.replaceAttemptState(tx, attemptId, { itemPosition: 1 }),
    );
    await db.transaction((tx) =>
      oddOneOutModule.replaceAttemptState(tx, attemptId, { itemPosition: 3 }),
    );
    expect(await oddOneOutModule.loadAttemptState(attemptId)).toEqual({
      itemPosition: 3,
    });
    await oddOneOutModule.clearAttemptState(attemptId);
    expect(await oddOneOutModule.loadAttemptState(attemptId)).toBeNull();
  });

  it("fails a content change that removes an item a saved attempt picked", async () => {
    await db.transaction((tx) =>
      oddOneOutModule.replaceAttemptState(tx, attemptId, { itemPosition: 3 }),
    );
    await expect(
      db.transaction((tx) =>
        oddOneOutModule.upsertContent(tx, puzzleId, {
          ...content,
          items: content.items.slice(0, 3),
        }),
      ),
    ).rejects.toThrow();
    await oddOneOutModule.clearAttemptState(attemptId);
  });
});
