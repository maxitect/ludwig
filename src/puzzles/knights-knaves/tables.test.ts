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
  knightsKnavesAttemptRoles,
  knightsKnavesAttempts,
  knightsKnavesCharacters,
  knightsKnavesPuzzles,
  knightsKnavesStatements,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { knightsKnavesModule } from "./module";
import { payloadSchema, type Content } from "./schema";

const content: Content = {
  questionText: "Who is who?",
  characters: [
    {
      name: "Ann",
      role: "knave",
      statements: [
        {
          content: "We are both knaves.",
          claim: {
            kind: "all",
            of: [
              { kind: "is", who: "Ann", role: "knave" },
              { kind: "is", who: "Bob", role: "knave" },
            ],
          },
        },
      ],
    },
    {
      name: "Bob",
      role: "knight",
      statements: [
        {
          content: "Ann is a knave.",
          claim: { kind: "is", who: "Ann", role: "knave" },
        },
        {
          content: "Ann lies.",
          claim: { kind: "is", who: "Ann", role: "knave" },
        },
      ],
    },
  ],
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('kk-test', 'kk', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('knights-knaves', 'kk-test', 'kk', 'kk', 'knights_knaves_puzzles', 1),
           ('other', 'kk-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertKk(tx: Tx, slug = "one") {
  const puzzleId = await insertPuzzle(tx, "knights-knaves", slug);
  await tx
    .insert(knightsKnavesPuzzles)
    .values({ puzzleId, questionText: "q" });
  await tx.insert(knightsKnavesCharacters).values([
    { puzzleId, position: 0, name: "Ann", role: "knave" },
    { puzzleId, position: 1, name: "Bob", role: "knight" },
  ]);
  return puzzleId;
}

async function insertAttempt(tx: Pick<Tx, "insert">, userId: string, puzzleId: string) {
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  return attempt.id;
}

describe("knights and knaves tables", () => {
  it("has the kk_role enum", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'kk_role' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["knight", "knave"]);
  });

  it("stores no predicate, json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'knights_knaves%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(predicate|claim|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("keys the statements on (puzzle_id, character_position, position)", async () => {
    const rows = await db.execute(sql`
      select a.attname from pg_index i
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = 'knights_knaves_statements'::regclass and i.indisprimary
      order by array_position(i.indkey::int2[], a.attnum)
    `);
    expect(rows.rows.map((row) => row.attname)).toEqual([
      "puzzle_id",
      "character_position",
      "position",
    ]);
  });

  it("accepts a statement for an existing character", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        await tx.insert(knightsKnavesStatements).values({
          puzzleId,
          characterPosition: 1,
          position: 0,
          content: "Ann lies.",
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a statement for a character position that does not exist", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        await tx.insert(knightsKnavesStatements).values({
          puzzleId,
          characterPosition: 2,
          position: 0,
          content: "Ann lies.",
        });
      }),
    ).toBe("23503");
  });

  it("rejects a statement for a character of another puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        const otherId = await insertPuzzle(tx, "knights-knaves", "two");
        await tx
          .insert(knightsKnavesPuzzles)
          .values({ puzzleId: otherId, questionText: "q" });
        await tx.insert(knightsKnavesStatements).values({
          puzzleId: otherId,
          characterPosition: 0,
          position: 0,
          content: "x",
        });
        expect(puzzleId).not.toBe(otherId);
      }),
    ).toBe("23503");
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(knightsKnavesPuzzles)
          .values({ puzzleId, questionText: "q" });
      }),
    ).toBe("23503");
  });

  it("rejects a knights and knaves puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "knights-knaves");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in knights_knaves_puzzles/);
  });

  it("rejects an unknown role, a sixth position and a repeated name at commit", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        await tx.execute(
          sql`insert into knights_knaves_characters (puzzle_id, position, name, role) values (${puzzleId}, 2, 'Cy', 'squire')`,
        );
      }),
    ).toBe("22P02");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        await tx.insert(knightsKnavesCharacters).values({
          puzzleId,
          position: 5,
          name: "Cy",
          role: "knight",
        });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKk(tx);
        await tx.insert(knightsKnavesCharacters).values({
          puzzleId,
          position: 2,
          name: "Ann",
          role: "knight",
        });
        await forceDeferred(tx);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t055tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const attemptId = await insertAttempt(tx, userId, puzzleId);
        await tx.insert(knightsKnavesAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });

  it("fills the puzzle id of an attempt and its roles from the attempt", async () => {
    const userId = await createTestUser("t055fill");
    const { puzzleId, role } = await rolledBack(async (tx) => {
      const puzzleId = await insertKk(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(knightsKnavesAttempts).values({ attemptId });
      await tx
        .insert(knightsKnavesAttemptRoles)
        .values({ attemptId, characterPosition: 0, role: "knave" });
      await forceDeferred(tx);
      const [attempt] = await tx.select().from(knightsKnavesAttempts);
      expect(attempt.puzzleId).toBe(puzzleId);
      const [role] = await tx.select().from(knightsKnavesAttemptRoles);
      return { puzzleId, role };
    });
    expect(role.puzzleId).toBe(puzzleId);
  });

  it("rejects an attempt role for a character the puzzle does not have, at commit", async () => {
    const userId = await createTestUser("t055role");
    const error = await pgError(async (tx) => {
      const puzzleId = await insertKk(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(knightsKnavesAttempts).values({ attemptId });
      await tx
        .insert(knightsKnavesAttemptRoles)
        .values({ attemptId, characterPosition: 3, role: "knight" });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23503");
  });
});

describe("knights and knaves module", () => {
  let puzzleId: string;
  let attemptId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "kk-test", name: "kk", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "knights-knaves",
        categoryKey: "kk-test",
        name: "kk",
        description: "kk",
        subtypeTable: "knights_knaves_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "knights-knaves",
          slug: "t055-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await knightsKnavesModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    attemptId = await insertAttempt(
      db,
      await createTestUser("t055mod"),
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

  it("loads names and statements with no roles and no predicates", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.characters).toEqual([
      { position: 0, name: "Ann", statements: ["We are both knaves."] },
      {
        position: 1,
        name: "Bob",
        statements: ["Ann is a knave.", "Ann lies."],
      },
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/role|claim|kind/);
    expect(
      payloadSchema
        .strict()
        .safeParse({
          ...payload,
          characters: [{ ...payload.characters[0], role: "knave" }],
        }).success,
    ).toBe(false);
  });

  it("checks answers against the stored roles", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toEqual([
      { position: 0, role: "knave" },
      { position: 1, role: "knight" },
    ]);
    expect(check(payload, solution, { roles: solution })).toEqual({
      correct: true,
      wrong: 0,
    });
    expect(
      check(payload, solution, {
        roles: [
          { position: 0, role: "knight" },
          { position: 1, role: "knight" },
        ],
      }),
    ).toEqual({ correct: false, wrong: 1 });
  });

  it("updates in place and drops a character the content no longer has", async () => {
    const before = await db.query.knightsKnavesStatements.findMany({
      where: { puzzleId },
    });
    expect(before).toHaveLength(3);
    await db.transaction((tx) =>
      knightsKnavesModule.upsertContent(tx, puzzleId, {
        ...content,
        characters: [
          { ...content.characters[0], name: "Anna" },
          {
            ...content.characters[1],
            statements: content.characters[1].statements.slice(0, 1),
          },
        ],
      }),
    );
    const payload = await load(puzzleId);
    expect(payload.characters.map(({ name }) => name)).toEqual(["Anna", "Bob"]);
    expect(payload.characters[1].statements).toHaveLength(1);
    await db.transaction((tx) =>
      knightsKnavesModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).characters[0].name).toBe("Ann");
  });

  it("swaps two characters' names on a reseed and drops a removed character", async () => {
    const [ann, bob] = content.characters;
    await db.transaction((tx) =>
      knightsKnavesModule.upsertContent(tx, puzzleId, {
        ...content,
        characters: [
          { ...bob, statements: [{ content: "Ann is a knave.", claim: { kind: "is", who: "Ann", role: "knave" } }] },
          { ...ann, statements: [{ content: "We are both knaves.", claim: { kind: "same", a: "Ann", b: "Bob" } }] },
          { name: "Cy", role: "knight", statements: [{ content: "Bob is a knight.", claim: { kind: "is", who: "Bob", role: "knight" } }] },
        ],
      }),
    );
    expect((await load(puzzleId)).characters.map(({ name }) => name)).toEqual(["Bob", "Ann", "Cy"]);
    await db.transaction((tx) =>
      knightsKnavesModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).characters.map(({ name }) => name)).toEqual(["Ann", "Bob"]);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    expect(await knightsKnavesModule.loadAttemptState(attemptId)).toBeNull();
    await db.transaction((tx) =>
      knightsKnavesModule.replaceAttemptState(tx, attemptId, {
        roles: [{ position: 0, role: "knight" }],
      }),
    );
    await db.transaction((tx) =>
      knightsKnavesModule.replaceAttemptState(tx, attemptId, {
        roles: [
          { position: 0, role: "knave" },
          { position: 1, role: "knight" },
        ],
      }),
    );
    expect(await knightsKnavesModule.loadAttemptState(attemptId)).toEqual({
      roles: [
        { position: 0, role: "knave" },
        { position: 1, role: "knight" },
      ],
    });
    await db.transaction((tx) =>
      knightsKnavesModule.replaceAttemptState(tx, attemptId, { roles: [] }),
    );
    expect(await knightsKnavesModule.loadAttemptState(attemptId)).toEqual({
      roles: [],
    });
    await knightsKnavesModule.clearAttemptState(attemptId);
    expect(await knightsKnavesModule.loadAttemptState(attemptId)).toBeNull();
  });

  it("fails a content change that removes a character a saved role names", async () => {
    await db.transaction((tx) =>
      knightsKnavesModule.replaceAttemptState(tx, attemptId, {
        roles: [{ position: 1, role: "knight" }],
      }),
    );
    await expect(
      db.transaction((tx) =>
        knightsKnavesModule.upsertContent(tx, puzzleId, {
          ...content,
          characters: content.characters.slice(0, 1),
        }),
      ),
    ).rejects.toThrow();
    await knightsKnavesModule.clearAttemptState(attemptId);
  });
});
