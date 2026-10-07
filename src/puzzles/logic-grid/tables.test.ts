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
  logicGridAttemptMarks,
  logicGridAttemptStruckClues,
  logicGridAttempts,
  logicGridCategories,
  logicGridClues,
  logicGridItems,
  logicGridPuzzles,
  logicGridSolutionLinks,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { classic, classicAmbiguous, variant } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { logicGridModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('lg-test', 'lg', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('logic-grid', 'lg-test', 'lg', 'lg', 'logic_grid_puzzles', 1),
           ('other', 'lg-test', 'other', 'other', 'zz_other_puzzles', 2)
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

/** A puzzle with one category of two items, returning the item ids. */
async function insertTinyPuzzle(tx: Tx, slug: string) {
  const puzzleId = await insertPuzzle(tx, "logic-grid", slug);
  await tx.insert(logicGridPuzzles).values({ puzzleId });
  await tx
    .insert(logicGridCategories)
    .values({ puzzleId, position: 0, name: "Person" });
  const items = await tx
    .insert(logicGridItems)
    .values([
      { puzzleId, categoryPosition: 0, position: 0, label: "Ann" },
      { puzzleId, categoryPosition: 0, position: 1, label: "Bob" },
    ])
    .returning({ id: logicGridItems.id });
  return { puzzleId, items: items.map(({ id }) => id) };
}

describe("logic grid schema", () => {
  it("derives the variant: no has_false_clue or similar column, and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'logic_grid%'
        and (column_name ~ 'variant|has_false|any_false' or data_type in ('jsonb', 'json', 'ARRAY'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("declares grid_mark with only yes and no", async () => {
    const rows = await db.execute<{ labels: string }>(sql`
      select string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      where t.typname = 'grid_mark'
    `);
    expect(rows.rows).toEqual([{ labels: "yes,no" }]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(logicGridPuzzles).values({ puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a logic grid puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "logic-grid");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in logic_grid_puzzles/);
  });

  it("rejects an item in a category the puzzle does not have", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await insertTinyPuzzle(tx, "t048-item-category");
        await tx
          .insert(logicGridItems)
          .values({ puzzleId, categoryPosition: 3, position: 0, label: "Cat" });
      }),
    ).toBe("23503");
  });

  it("rejects two items in one slot", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await insertTinyPuzzle(tx, "t048-slot");
        await tx
          .insert(logicGridItems)
          .values({ puzzleId, categoryPosition: 0, position: 0, label: "Cat" });
      }),
    ).toBe("23505");
  });

  it("allows one false clue per puzzle and rejects a second", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await insertTinyPuzzle(tx, "t048-false-one");
        await tx.insert(logicGridClues).values([
          { puzzleId, position: 0, content: "a", isFalse: true },
          { puzzleId, position: 1, content: "b" },
        ]);
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId } = await insertTinyPuzzle(tx, "t048-false-two");
        await tx.insert(logicGridClues).values([
          { puzzleId, position: 0, content: "a", isFalse: true },
          { puzzleId, position: 1, content: "b", isFalse: true },
        ]);
      }),
    ).toBe("23505");
  });
});

describe("logic_grid_solution_links composite foreign keys", () => {
  it("accepts a link between two items of one puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, items } = await insertTinyPuzzle(tx, "t048-link-ok");
        await tx
          .insert(logicGridSolutionLinks)
          .values({ puzzleId, itemAId: items[0], itemBId: items[1] });
      }),
    ).toBeUndefined();
  });

  it("rejects item_b_id that belongs to another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await insertTinyPuzzle(tx, "t048-link-a");
        const second = await insertTinyPuzzle(tx, "t048-link-b");
        await tx.insert(logicGridSolutionLinks).values({
          puzzleId: first.puzzleId,
          itemAId: first.items[0],
          itemBId: second.items[0],
        });
      }),
    ).toBe("23503");
  });

  it("rejects item_a_id that belongs to another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const first = await insertTinyPuzzle(tx, "t048-link-c");
        const second = await insertTinyPuzzle(tx, "t048-link-d");
        await tx.insert(logicGridSolutionLinks).values({
          puzzleId: first.puzzleId,
          itemAId: second.items[0],
          itemBId: first.items[1],
        });
      }),
    ).toBe("23503");
  });

  it("rejects a link from an item to itself", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const { puzzleId, items } = await insertTinyPuzzle(tx, "t048-link-self");
        await tx
          .insert(logicGridSolutionLinks)
          .values({ puzzleId, itemAId: items[0], itemBId: items[0] });
      }),
    ).toBe("23514");
  });
});

describe("logic grid module", () => {
  let puzzleId: string;
  let variantId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  async function upsertContentPuzzle(slug: string, content = classic) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({ typeKey: "logic-grid", slug, title: slug, difficulty: 1 })
        .returning({ id: puzzles.id });
      await logicGridModule.upsertContent(tx, row.id, content);
      return row.id;
    });
  }

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "lg-test", name: "lg", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "logic-grid",
        categoryKey: "lg-test",
        name: "lg",
        description: "lg",
        subtypeTable: "logic_grid_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await upsertContentPuzzle("t048-module");
    variantId = await upsertContentPuzzle("t048-variant", variant);
    userId = await createTestUser("t048mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} ~ '^t048-'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds neither links nor is_false", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.variant).toBe(false);
    expect(payload.categories.map(({ items }) => items.length)).toEqual([3, 3, 3]);
    expect(payload.clues).toHaveLength(classic.clues.length);
    expect(JSON.stringify(payload)).not.toMatch(/isFalse|is_false|itemAId|links/);
  });

  it("loads a variant payload that says only that a clue is false", async () => {
    const payload = await load(variantId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.variant).toBe(true);
    expect(payload.clues).toHaveLength(variant.clues.length);
    expect(JSON.stringify(payload)).not.toMatch(/isFalse|is_false|itemAId|links/);
    expect(Object.keys(payload.clues[0]).sort()).toEqual(["content", "position"]);
  });

  it("orders categories, items and clues by position", async () => {
    const payload = await load(puzzleId);
    expect(payload.categories.map(({ name }) => name)).toEqual(["Person", "Pet", "Hat"]);
    expect(payload.categories[1].items.map(({ label }) => label)).toEqual(["Dog", "Eel", "Fox"]);
    expect(payload.clues.map(({ content }) => content)).toEqual(
      classic.clues.map(({ content }) => content),
    );
  });

  it("checks the loaded solution: the stored household links pass, a swap fails", async () => {
    const payload = await load(puzzleId);
    const solution = await loadSolution(puzzleId);
    expect(solution.links).toHaveLength(6);
    expect(check(payload, solution, { links: solution.links }).correct).toBe(true);
    const swapped = solution.links.map((link, i) =>
      i === 1 ? { ...link, itemBId: solution.links[3].itemBId } : link,
    );
    expect(check(payload, solution, { links: swapped }).correct).toBe(false);
    expect((await loadSolution(variantId)).clues.filter((c) => c.isFalse)).toEqual([
      { position: 4, isFalse: true },
    ]);
  });

  it("re-seeds in place: item ids, links and the false clue follow the content, and ids stay stable", async () => {
    const before = await load(puzzleId);
    await db.transaction((tx) => logicGridModule.upsertContent(tx, puzzleId, classic));
    expect(await load(puzzleId)).toEqual(before);

    await db.transaction((tx) =>
      logicGridModule.upsertContent(tx, puzzleId, classicAmbiguous),
    );
    const trimmed = await load(puzzleId);
    expect(trimmed.clues).toHaveLength(3);
    expect(trimmed.categories.map(({ items }) => items.map(({ id }) => id))).toEqual(
      before.categories.map(({ items }) => items.map(({ id }) => id)),
    );
    await db.transaction((tx) => logicGridModule.upsertContent(tx, puzzleId, classic));
  });

  it("moves the false clue to another position on re-seed", async () => {
    const id = await upsertContentPuzzle("t048-move-false", variant);
    const moved = {
      ...variant,
      clues: [variant.clues[4], ...variant.clues.slice(0, 4)],
    };
    await db.transaction((tx) => logicGridModule.upsertContent(tx, id, moved));
    expect((await loadSolution(id)).clues.find((c) => c.isFalse)?.position).toBe(0);
  });

  describe("attempt state", () => {
    it("replaces, reads back and clears the attempt state", async () => {
      const payload = await load(puzzleId);
      const [ann, bob] = payload.categories[0].items;
      const [dog, eel] = payload.categories[1].items;
      const [attempt] = await db
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      expect(await logicGridModule.loadAttemptState(attempt.id)).toBeNull();

      await db.transaction((tx) =>
        logicGridModule.replaceAttemptState(tx, attempt.id, {
          marks: [
            { itemAId: ann.id, itemBId: dog.id, mark: "yes" },
            { itemAId: ann.id, itemBId: eel.id, mark: "no" },
            { itemAId: bob.id, itemBId: dog.id, mark: "no" },
          ],
          struckClues: [{ cluePosition: 0 }, { cluePosition: 2 }],
          falseCluePosition: null,
        }),
      );
      await db.transaction((tx) =>
        logicGridModule.replaceAttemptState(tx, attempt.id, {
          marks: [{ itemAId: ann.id, itemBId: dog.id, mark: "yes" }],
          struckClues: [{ cluePosition: 1 }],
          falseCluePosition: 3,
        }),
      );
      const saved = await logicGridModule.loadAttemptState(attempt.id);
      expect(saved).toEqual({
        marks: [{ itemAId: ann.id, itemBId: dog.id, mark: "yes" }],
        struckClues: [{ cluePosition: 1 }],
        falseCluePosition: 3,
      });
      const marks = await db.execute(
        sql`select mark from logic_grid_attempt_marks where attempt_id = ${attempt.id}`,
      );
      expect(marks.rows).toEqual([{ mark: "yes" }]);

      await db.transaction((tx) =>
        logicGridModule.replaceAttemptState(tx, attempt.id, {
          marks: [],
          struckClues: [],
          falseCluePosition: null,
        }),
      );
      expect(await logicGridModule.loadAttemptState(attempt.id)).toEqual({
        marks: [],
        struckClues: [],
        falseCluePosition: null,
      });

      await logicGridModule.clearAttemptState(attempt.id);
      expect(await logicGridModule.loadAttemptState(attempt.id)).toBeNull();
    });
  });

  describe("attempt row triggers and foreign keys", () => {
    async function startAttempt(tx: Tx, forPuzzle = puzzleId) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId: forPuzzle })
        .returning({ id: attempts.id });
      await tx.insert(logicGridAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    const itemsOf = async (id: string) =>
      (await load(id)).categories.flatMap(({ items }) => items);

    it("fills puzzle_id on the attempt, its marks and its struck clues", async () => {
      const [first, second] = await itemsOf(puzzleId);
      const rows = await rolledBack(async (tx) => {
        const attemptId = await startAttempt(tx);
        await tx
          .insert(logicGridAttemptMarks)
          .values({ attemptId, itemAId: first.id, itemBId: second.id, mark: "no" });
        await tx
          .insert(logicGridAttemptStruckClues)
          .values({ attemptId, cluePosition: 0 });
        const read = async (table: string) =>
          (
            await tx.execute(
              sql`select puzzle_id from ${sql.raw(table)} where attempt_id = ${attemptId}`,
            )
          ).rows as { puzzle_id: string }[];
        return [
          await read("logic_grid_attempts"),
          await read("logic_grid_attempt_marks"),
          await read("logic_grid_attempt_struck_clues"),
        ];
      });
      for (const table of rows) expect(table).toEqual([{ puzzle_id: puzzleId }]);
    });

    it("rejects a mark on an item of another puzzle", async () => {
      const [own] = await itemsOf(puzzleId);
      const [foreign] = await itemsOf(variantId);
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(logicGridAttemptMarks).values({
            attemptId,
            itemAId: own.id,
            itemBId: foreign.id,
            mark: "yes",
          });
        }),
      ).toBe("23503");
    });

    it("rejects a struck clue or flagged clue the puzzle does not have", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(logicGridAttemptStruckClues)
            .values({ attemptId, cluePosition: 40 });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .update(logicGridAttempts)
            .set({ falseCluePosition: 40 })
            .where(eq(logicGridAttempts.attemptId, attemptId));
        }),
      ).toBe("23503");
    });

    it("rejects an explicit puzzle_id that is not the attempt's", async () => {
      const [first, second] = await itemsOf(variantId);
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(logicGridAttemptMarks).values({
            attemptId,
            puzzleId: variantId,
            itemAId: first.id,
            itemBId: second.id,
            mark: "yes",
          });
        }),
      ).toBe("23503");
    });

    it("rejects a logic grid attempt for a puzzle of another type", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t048-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(logicGridAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
    });

    it("fails a re-seed that removes an item or a clue a saved attempt references", async () => {
      const items = await itemsOf(puzzleId);
      await db.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await db
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await db.transaction(async (tx) => {
        await logicGridModule.replaceAttemptState(tx, attempt.id, {
          marks: [{ itemAId: items[0].id, itemBId: items[6].id, mark: "yes" }],
          struckClues: [{ cluePosition: 3 }],
          falseCluePosition: null,
        });
      });
      const smaller = {
        ...classic,
        categories: classic.categories.slice(0, 2),
        solution: classic.solution.map((row) => row.slice(0, 2)),
      };
      const error = await pgError(async (tx) => {
        await logicGridModule.upsertContent(tx, puzzleId, smaller);
      });
      expect(error?.code).toBe("23503");
      const fewerClues = { ...classic, clues: classic.clues.slice(0, 3) };
      expect(
        await pgErrorCode((tx) =>
          logicGridModule.upsertContent(tx, puzzleId, fewerClues),
        ),
      ).toBe("23503");
      expect(await logicGridModule.loadAttemptState(attempt.id)).toMatchObject({
        struckClues: [{ cluePosition: 3 }],
      });
      await logicGridModule.clearAttemptState(attempt.id);
    });
  });
});
