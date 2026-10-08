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
  acrosticAttempts,
  acrosticLines,
  acrosticPuzzles,
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { acrosticModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  rule: "first_letter_line" as const,
  lines: ["Add one.", "Bring two.", "Carry three.", "Drop four."],
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('ac-test', 'ac', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('acrostic', 'ac-test', 'ac', 'ac', 'acrostic_puzzles', 1),
           ('other', 'ac-test', 'other', 'other', 'zz_other_puzzles', 2)
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

describe("acrostic tables", () => {
  it("has the acrostic_rule enum with the three rules", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'acrostic_rule' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual([
      "first_letter_line",
      "first_letter_word",
      "last_letter_line",
    ]);
  });

  it("has no message, answer or solution column on the puzzle tables and no json or array column", async () => {
    const stored = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name in ('acrostic_puzzles', 'acrostic_lines')
        and column_name ~ '(message|answer|solution)'
    `);
    expect(stored.rows).toHaveLength(0);
    const text = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'acrostic%' and column_name ~ '(message|answer|solution)'
    `);
    expect(text.rows).toEqual([
      { table_name: "acrostic_attempts", column_name: "answer" },
    ]);
    const structured = await db.execute(sql`
      select 1 from information_schema.columns
      where table_name like 'acrostic%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(structured.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(acrosticPuzzles).values({ puzzleId, rule: "first_letter_line" });
      }),
    ).toBe("23503");
  });

  it("rejects an acrostic puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "acrostic");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in acrostic_puzzles/);
  });

  it("rejects an unknown rule", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "acrostic");
        await tx.execute(
          sql`insert into acrostic_puzzles (puzzle_id, rule) values (${puzzleId}, 'middle_letter')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects a line with no letters and a negative position", async () => {
    for (const [position, line] of [
      [0, "1234"],
      [-1, "ok"],
    ] as const) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertPuzzle(tx, "acrostic");
          await tx
            .insert(acrosticPuzzles)
            .values({ puzzleId, rule: "first_letter_line" });
          await tx
            .insert(acrosticLines)
            .values({ puzzleId, position, content: line });
        }),
      ).toBe("23514");
    }
  });

  it("rejects an acrostic attempt of another puzzle type and an over-long answer", async () => {
    const userId = await createTestUser("t050tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(acrosticAttempts).values({ attemptId: attempt.id, answer: "ink" });
      }),
    ).toBe("23503");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "acrostic");
        await tx.insert(acrosticPuzzles).values({ puzzleId, rule: "first_letter_line" });
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx
          .insert(acrosticAttempts)
          .values({ attemptId: attempt.id, answer: "x".repeat(81) });
      }),
    ).toBe("23514");
  });
});

describe("acrostic module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "ac-test", name: "ac", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "acrostic",
        categoryKey: "ac-test",
        name: "ac",
        description: "ac",
        subtypeTable: "acrostic_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({ typeKey: "acrostic", slug: "t050-module", title: "t", difficulty: 1 })
        .returning({ id: puzzles.id });
      await acrosticModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t050mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads lines and the rule label, with no message and no rule key", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual(["lines", "ruleLabel"]);
    expect(payload.lines).toEqual(content.lines);
    expect(payload.ruleLabel).toBe("Read the first letter of each line");
    expect(JSON.stringify(payload)).not.toContain("ABCD");
    expect(JSON.stringify(payload)).not.toContain("first_letter_line");
    expect(
      payloadSchema.strict().safeParse({ ...payload, message: "ABCD" }).success,
    ).toBe(false);
  });

  it("derives the solution from the lines and checks answers against it", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toBe("ABCD");
    expect(check(payload, solution, { answer: "a.b c-d" }).correct).toBe(true);
    expect(check(payload, solution, { answer: "abc" }).correct).toBe(false);
  });

  it("shortens the lines when the content shrinks and updates the rule", async () => {
    await db.transaction((tx) =>
      acrosticModule.upsertContent(tx, puzzleId, {
        rule: "last_letter_line",
        lines: content.lines.slice(0, 2),
      }),
    );
    expect(await loadSolution(puzzleId)).toBe("EO");
    await db.transaction((tx) =>
      acrosticModule.upsertContent(tx, puzzleId, content),
    );
    expect(await loadSolution(puzzleId)).toBe("ABCD");
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await acrosticModule.loadAttemptState(attempt.id)).toBeNull();
    await db.transaction((tx) =>
      acrosticModule.replaceAttemptState(tx, attempt.id, { answer: "ab" }),
    );
    await db.transaction((tx) =>
      acrosticModule.replaceAttemptState(tx, attempt.id, { answer: "a b, c" }),
    );
    expect(await acrosticModule.loadAttemptState(attempt.id)).toEqual({
      answer: "a b, c",
    });
    await db.transaction((tx) =>
      acrosticModule.replaceAttemptState(tx, attempt.id, { answer: null }),
    );
    expect(await acrosticModule.loadAttemptState(attempt.id)).toEqual({
      answer: null,
    });
    await acrosticModule.clearAttemptState(attempt.id);
    expect(await acrosticModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
