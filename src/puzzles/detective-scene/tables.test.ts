import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { content as fixture } from "../../../content/detective-scene/fixture-street";
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
  detectiveSceneAttemptFound,
  detectiveSceneAttempts,
  detectiveSceneItemAliases,
  detectiveSceneItems,
  detectiveScenePuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { detectiveSceneModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('ds-test', 'ds', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('detective-scene', 'ds-test', 'ds', 'ds', 'detective_scene_puzzles', 1),
           ('other', 'ds-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertScene(tx: Tx, slug = "one") {
  const puzzleId = await insertPuzzle(tx, "detective-scene", slug);
  await tx
    .insert(detectiveScenePuzzles)
    .values({ puzzleId, sceneKey: `t091-${slug}`, width: 100, height: 80 });
  await tx.insert(detectiveSceneItems).values({
    puzzleId,
    position: 0,
    title: "The Sweeney",
    x: 10,
    y: 10,
    width: 20,
    height: 10,
  });
  return puzzleId;
}

async function insertAttempt(tx: Tx, userId: string, puzzleId: string) {
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  return attempt.id;
}

describe("detective scene tables", () => {
  it("creates no json, array or solution-position columns", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'detective_scene%'
        and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(detectiveScenePuzzles)
          .values({ puzzleId, sceneKey: "t091-x", width: 10, height: 10 });
      }),
    ).toBe("23503");
  });

  it("rejects a detective scene puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "detective-scene");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in detective_scene_puzzles/);
  });

  it("accepts a valid puzzle, item and alias", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertScene(tx);
        await tx
          .insert(detectiveSceneItemAliases)
          .values({ puzzleId, position: 0, alias: "Sweeney" });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a duplicate scene key", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertScene(tx, "one");
        const otherId = await insertPuzzle(tx, "detective-scene", "two");
        await tx.insert(detectiveScenePuzzles).values({
          puzzleId: otherId,
          sceneKey: "t091-one",
          width: 10,
          height: 10,
        });
      }),
    ).toBe("23505");
  });

  it.each([
    ["a position of 50", { position: 50 }],
    ["a negative position", { position: -1 }],
    ["an empty title", { title: "" }],
    ["a negative x", { x: -1 }],
    ["a zero width", { width: 0 }],
    ["a zero height", { height: 0 }],
  ])("rejects an item with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertScene(tx);
        await tx.insert(detectiveSceneItems).values({
          puzzleId,
          position: 1,
          title: "Taggart",
          x: 50,
          y: 50,
          width: 10,
          height: 10,
          ...override,
        });
      }),
    ).toBe("23514");
  });

  it("rejects an alias of an item the puzzle does not have", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertScene(tx);
        await tx
          .insert(detectiveSceneItemAliases)
          .values({ puzzleId, position: 4, alias: "Nope" });
      }),
    ).toBe("23503");
  });

  it("rejects an alias of another puzzle's item", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertScene(tx, "one");
        const otherId = await insertPuzzle(tx, "detective-scene", "two");
        await tx.insert(detectiveScenePuzzles).values({
          puzzleId: otherId,
          sceneKey: "t091-two",
          width: 10,
          height: 10,
        });
        await tx
          .insert(detectiveSceneItemAliases)
          .values({ puzzleId: otherId, position: 0, alias: "Nope" });
      }),
    ).toBe("23503");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t091tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const attemptId = await insertAttempt(tx, userId, puzzleId);
        await tx.insert(detectiveSceneAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });

  it("fills the puzzle id of an attempt and its found rows from the attempt", async () => {
    const userId = await createTestUser("t091fill");
    const { puzzleId, found } = await rolledBack(async (tx) => {
      const puzzleId = await insertScene(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(detectiveSceneAttempts).values({ attemptId });
      await tx
        .insert(detectiveSceneAttemptFound)
        .values({ attemptId, position: 0 });
      await forceDeferred(tx);
      const [attempt] = await tx.select().from(detectiveSceneAttempts);
      const [found] = await tx.select().from(detectiveSceneAttemptFound);
      expect(attempt.puzzleId).toBe(puzzleId);
      return { puzzleId, found };
    });
    expect(found.puzzleId).toBe(puzzleId);
  });

  it("rejects a found row with an explicit puzzle id that does not match the attempt", async () => {
    const userId = await createTestUser("t091mismatch");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertScene(tx, "one");
      const otherId = await insertScene(tx, "two");
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(detectiveSceneAttempts).values({ attemptId });
      await tx
        .insert(detectiveSceneAttemptFound)
        .values({ attemptId, puzzleId: otherId, position: 0 });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });

  it("rejects an attempt row with an explicit puzzle id that does not match the attempt", async () => {
    const userId = await createTestUser("t091attempt");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertScene(tx, "one");
      const otherId = await insertScene(tx, "two");
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx
        .insert(detectiveSceneAttempts)
        .values({ attemptId, puzzleId: otherId });
    });
    expect(error?.code).toBe("23503");
  });

  it("rejects a found position the puzzle has no item for, at commit", async () => {
    const userId = await createTestUser("t091nopos");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertScene(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(detectiveSceneAttempts).values({ attemptId });
      await tx
        .insert(detectiveSceneAttemptFound)
        .values({ attemptId, position: 7 });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });
});

describe("detective scene module", () => {
  let fixtureId: string;
  let created = false;
  let editedId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  async function ensureAttempt() {
    await db
      .insert(attempts)
      .values({ userId, puzzleId: editedId })
      .onConflictDoNothing();
    const attempt = await db.query.attempts.findFirst({
      where: { userId, puzzleId: editedId },
      columns: { id: true },
    });
    return { id: attempt!.id };
  }

  async function insertContentPuzzle(slug: string, content: typeof fixture) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "detective-scene",
          slug,
          title: slug,
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await detectiveSceneModule.upsertContent(tx, row.id, content);
      return row.id;
    });
  }

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "ds-test", name: "ds", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "detective-scene",
        categoryKey: "ds-test",
        name: "ds",
        description: "ds",
        subtypeTable: "detective_scene_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    const seeded = await db.query.detectiveScenePuzzles.findFirst({
      where: { sceneKey: fixture.sceneKey },
      columns: { puzzleId: true },
    });
    if (seeded) {
      fixtureId = seeded.puzzleId;
    } else {
      created = true;
      fixtureId = await insertContentPuzzle("t091-fixture", fixture);
    }
    editedId = await insertContentPuzzle("t091-edited", {
      ...fixture,
      sceneKey: "t091-edited-scene",
    });
    userId = await createTestUser("t091mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, editedId));
    if (created) await db.delete(puzzles).where(eq(puzzles.id, fixtureId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload with the scene and a count and nothing else", async () => {
    const payload = await load(fixtureId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "height",
      "itemCount",
      "puzzleId",
      "sceneKey",
      "width",
    ]);
    expect(payload.itemCount).toBe(3);
  });

  it("carries no title, alias or region in the payload", async () => {
    const payload = await load(fixtureId);
    const json = JSON.stringify(payload);
    for (const item of fixture.items) {
      expect(json).not.toContain(item.title);
      for (const alias of item.aliases) expect(json).not.toContain(alias);
    }
    expect(() =>
      payloadSchema.strict().parse({ ...payload, items: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({ ...payload, titles: ["Taggart"] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({ ...payload, aliases: ["Morse"] }),
    ).toThrow();
  });

  it("stores the items and aliases and checks a full set of finds", async () => {
    const solution = await loadSolution(fixtureId);
    expect(solution.items.map(({ title }) => title)).toEqual(
      fixture.items.map(({ title }) => title),
    );
    expect(solution.aliases).toEqual([{ position: 2, alias: "Morse" }]);
    const payload = await load(fixtureId);
    const finds = fixture.items.map((item) => ({
      x: item.x + item.width / 2,
      y: item.y + item.height / 2,
      title: item.title,
    }));
    expect(check(payload, solution, { finds }).correct).toBe(true);
    expect(check(payload, solution, { finds: finds.slice(1) }).correct).toBe(
      false,
    );
  });

  it("updates in place, dropping the items and aliases that went", async () => {
    await db.transaction(async (tx) => {
      await detectiveSceneModule.upsertContent(tx, editedId, {
        ...fixture,
        sceneKey: "t091-edited-scene",
        items: [{ ...fixture.items[0], aliases: ["Flying Squad"] }],
      });
    });
    const items = await db
      .select()
      .from(detectiveSceneItems)
      .where(eq(detectiveSceneItems.puzzleId, editedId));
    const aliases = await db
      .select()
      .from(detectiveSceneItemAliases)
      .where(eq(detectiveSceneItemAliases.puzzleId, editedId));
    expect(items).toHaveLength(1);
    expect(aliases.map(({ alias }) => alias)).toEqual(["Flying Squad"]);
    await db.transaction(async (tx) => {
      await detectiveSceneModule.upsertContent(tx, editedId, {
        ...fixture,
        sceneKey: "t091-edited-scene",
      });
    });
    const restored = await db
      .select()
      .from(detectiveSceneItemAliases)
      .where(eq(detectiveSceneItemAliases.puzzleId, editedId));
    expect(restored.map(({ alias }) => alias)).toEqual(["Morse"]);
  });

  it("saves, reads back and clears the found positions", async () => {
    const attempt = await ensureAttempt();
    await db.transaction((tx) =>
      detectiveSceneModule.replaceAttemptState(tx, attempt.id, {
        found: [0, 2],
      }),
    );
    expect(await detectiveSceneModule.loadAttemptState(attempt.id)).toEqual({
      found: [0, 2],
    });
    await detectiveSceneModule.clearAttemptState(attempt.id);
    expect(await detectiveSceneModule.loadAttemptState(attempt.id)).toBeNull();
  });

  it("fails the seed for an item a saved find still points at", async () => {
    const attempt = await ensureAttempt();
    await db.transaction((tx) =>
      detectiveSceneModule.replaceAttemptState(tx, attempt.id, { found: [2] }),
    );
    await expect(
      db.transaction((tx) =>
        detectiveSceneModule.upsertContent(tx, editedId, {
          ...fixture,
          sceneKey: "t091-edited-scene",
          items: fixture.items.slice(0, 2),
        }),
      ),
    ).rejects.toThrow();
    await detectiveSceneModule.clearAttemptState(attempt.id);
  });
});
