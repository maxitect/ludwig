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
  napkinMathsAttempts,
  napkinMathsLines,
  napkinMathsPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { napkinMathsModule } from "./module";
import { answerSchema, payloadSchema, type Content } from "./schema";

const content: Content = {
  questionText: "What is x?",
  answer: "4",
  lines: ["x + 1 = 5", "x is whole"],
};

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('nm-test', 'nm', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('napkin-maths', 'nm-test', 'nm', 'nm', 'napkin_maths_puzzles', 1),
           ('other', 'nm-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertNapkin(tx: Tx, slug = "one") {
  const puzzleId = await insertPuzzle(tx, "napkin-maths", slug);
  await tx
    .insert(napkinMathsPuzzles)
    .values({ puzzleId, questionText: "q", answer: "4" });
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

describe("napkin maths tables", () => {
  it("stores the answer as numeric and no json or array column", async () => {
    const numeric = await db.execute(sql`
      select table_name, data_type from information_schema.columns
      where column_name = 'answer' and table_name like 'napkin_maths%'
    `);
    expect(numeric.rows).toHaveLength(2);
    expect(numeric.rows.every((row) => row.data_type === "numeric")).toBe(true);
    const bad = await db.execute(sql`
      select column_name from information_schema.columns
      where table_name like 'napkin_maths%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(bad.rows).toHaveLength(0);
  });

  it("rejects a text answer", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "napkin-maths");
        await tx.execute(
          sql`insert into napkin_maths_puzzles (puzzle_id, question_text, answer) values (${puzzleId}, 'q', 'four')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(napkinMathsPuzzles)
          .values({ puzzleId, questionText: "q", answer: "4" });
      }),
    ).toBe("23503");
  });

  it("rejects a napkin maths puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "napkin-maths");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in napkin_maths_puzzles/);
  });

  it("limits line positions to 0 to 11 and keeps one line per position", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertNapkin(tx);
        await tx
          .insert(napkinMathsLines)
          .values({ puzzleId, position: 12, content: "x" });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertNapkin(tx);
        await tx.insert(napkinMathsLines).values([
          { puzzleId, position: 0, content: "x" },
          { puzzleId, position: 0, content: "y" },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t057tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const attemptId = await insertAttempt(tx, userId, puzzleId);
        await tx.insert(napkinMathsAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });

  it("keeps the attempt answer optional", async () => {
    const userId = await createTestUser("t057null");
    const attempt = await rolledBack(async (tx) => {
      const puzzleId = await insertNapkin(tx);
      const attemptId = await insertAttempt(tx, userId, puzzleId);
      await tx.insert(napkinMathsAttempts).values({ attemptId });
      await forceDeferred(tx);
      const [row] = await tx.select().from(napkinMathsAttempts);
      return row;
    });
    expect(attempt.answer).toBeNull();
  });
});

describe("napkin maths module", () => {
  let puzzleId: string;
  let attemptId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "nm-test", name: "nm", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "napkin-maths",
        categoryKey: "nm-test",
        name: "nm",
        description: "nm",
        subtypeTable: "napkin_maths_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "napkin-maths",
          slug: "t057-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await napkinMathsModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    attemptId = await insertAttempt(
      db,
      await createTestUser("t057mod"),
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

  it("loads the question and lines with no answer", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload).toEqual({
      questionText: "What is x?",
      lines: ["x + 1 = 5", "x is whole"],
    });
    expect(
      payloadSchema.strict().safeParse({ ...payload, answer: "4" }).success,
    ).toBe(false);
  });

  it("checks the stored numeric exactly", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toBe("4.000000");
    for (const answer of ["4", "4.0", "04"]) {
      expect(
        check(payload, solution, answerSchema.parse({ answer })),
      ).toEqual({ correct: true });
    }
    expect(
      check(payload, solution, answerSchema.parse({ answer: "4.01" })),
    ).toEqual({ correct: false });
    expect(answerSchema.safeParse({ answer: "four" }).success).toBe(false);
  });

  it("updates in place and drops lines the content no longer has", async () => {
    await db.transaction((tx) =>
      napkinMathsModule.upsertContent(tx, puzzleId, {
        ...content,
        answer: "4.5",
        lines: ["a", "b", "c"],
      }),
    );
    expect((await load(puzzleId)).lines).toEqual(["a", "b", "c"]);
    expect(await loadSolution(puzzleId)).toBe("4.500000");
    await db.transaction((tx) =>
      napkinMathsModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).lines).toEqual(content.lines);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    expect(await napkinMathsModule.loadAttemptState(attemptId)).toBeNull();
    await db.transaction((tx) =>
      napkinMathsModule.replaceAttemptState(tx, attemptId, { answer: "3" }),
    );
    await db.transaction((tx) =>
      napkinMathsModule.replaceAttemptState(tx, attemptId, { answer: "4.5" }),
    );
    expect(await napkinMathsModule.loadAttemptState(attemptId)).toEqual({
      answer: "4.500000",
    });
    await napkinMathsModule.clearAttemptState(attemptId);
    expect(await napkinMathsModule.loadAttemptState(attemptId)).toBeNull();
  });
});
