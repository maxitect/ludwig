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
  attempts,
  crosswordAttemptCells,
  crosswordAttempts,
  crosswordCells,
  crosswordClueSegments,
  crosswordClues,
  crosswordPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { fixture } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { crosswordModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('cw-test', 'cw', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('crossword', 'cw-test', 'cw', 'cw', 'crossword_puzzles', 1),
           ('other', 'cw-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const grid = { style: fixture.style, rows: fixture.rows, cols: fixture.cols };

describe("crossword schema", () => {
  it("has no number, is_block or answer columns", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_name like 'crossword%' and column_name in ('number', 'is_block', 'answer')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates no json or array columns", async () => {
    const rows = await db.execute(sql`
      select table_name, data_type from information_schema.columns
      where table_name like 'crossword%' and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a crossword puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "crossword");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in crossword_puzzles/);
  });

  it("accepts a valid supertype and subtype pair", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "crossword");
        await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a clue that does not start on a cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "crossword");
        await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId });
        await tx.insert(crosswordClues).values({
          puzzleId,
          direction: "across",
          row: 0,
          col: 0,
          clueText: "x",
        });
      }),
    ).toBe("23503");
  });

  it("rejects a lowercase cell letter and a segment of length 0", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "crossword");
        await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId });
        await tx
          .insert(crosswordCells)
          .values({ puzzleId, row: 0, col: 0, letter: "a" });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "crossword");
        await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId });
        await tx
          .insert(crosswordCells)
          .values({ puzzleId, row: 0, col: 0, letter: "A" });
        await tx
          .insert(crosswordClues)
          .values({ puzzleId, direction: "across", row: 0, col: 0, clueText: "x" });
        await tx.insert(crosswordClueSegments).values({
          puzzleId,
          direction: "across",
          row: 0,
          col: 0,
          position: 0,
          length: 0,
        });
      }),
    ).toBe("23514");
  });
});

describe("crossword module", () => {
  let puzzleId: string;
  let otherPuzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  async function insertContentPuzzle(slug: string) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({ typeKey: "crossword", slug, title: slug, difficulty: 1 })
        .returning({ id: puzzles.id });
      await crosswordModule.insertContent(tx, row.id, fixture);
      return row.id;
    });
  }

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "cw-test", name: "cw", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "crossword",
        categoryKey: "cw-test",
        name: "cw",
        description: "cw",
        subtypeTable: "crossword_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await insertContentPuzzle("t022-module");
    otherPuzzleId = await insertContentPuzzle("t022-other");
    userId = await createTestUser("t022mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't022-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that parses strictly and holds no letters", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.cells).toHaveLength(fixture.cells.length);
    expect(payload.clues).toHaveLength(fixture.clues.length);
    expect(JSON.stringify(payload)).not.toMatch(/"letter"/);
    expect(JSON.stringify(payload.cells)).not.toMatch(/[A-Z]/);
  });

  it("round-trips segments in position order", async () => {
    const split = {
      ...fixture,
      clues: fixture.clues.map((c, i) =>
        i === 0 ? { ...c, segments: [2, 3] } : c,
      ),
    };
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "crossword",
          slug: "t022-segments",
          title: "s",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await crosswordModule.insertContent(tx, row.id, split);
      return row.id;
    });
    const payload = await load(id);
    expect(
      payload.clues.find((c) => c.direction === "across" && c.row === 0)
        ?.segments,
    ).toEqual([2, 3]);
  });

  it("loads the solution and checks answers against it", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(solution).toHaveLength(fixture.cells.length);
    expect(check(payload, solution, { cells: fixture.cells }).correct).toBe(
      true,
    );
    expect(
      check(payload, solution, {
        cells: fixture.cells.map((c, i) => (i === 0 ? { ...c, letter: "Z" } : c)),
      }).correct,
    ).toBe(false);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await crosswordModule.loadAttemptState(attempt.id)).toBeNull();

    const first = [
      { row: 0, col: 0, letter: "C" },
      { row: 0, col: 1, letter: "R" },
    ];
    await db.transaction((tx) =>
      crosswordModule.replaceAttemptState(tx, attempt.id, {
        cells: [...first, { row: 4, col: 4, letter: "N" }],
      }),
    );
    await db.transaction((tx) =>
      crosswordModule.replaceAttemptState(tx, attempt.id, { cells: first }),
    );
    const saved = await crosswordModule.loadAttemptState(attempt.id);
    expect(saved?.cells).toHaveLength(2);
    expect(saved?.cells).toEqual(expect.arrayContaining(first));

    await db.transaction((tx) =>
      crosswordModule.replaceAttemptState(tx, attempt.id, { cells: [] }),
    );
    expect(await crosswordModule.loadAttemptState(attempt.id)).toEqual({
      cells: [],
    });

    await crosswordModule.clearAttemptState(attempt.id);
    expect(await crosswordModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt cell triggers", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(crosswordAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it("fills the attempt's puzzle_id and the attempt cell's puzzle_id", async () => {
      let attemptRow: { puzzle_id: string } | undefined;
      let cellRow: { puzzle_id: string } | undefined;
      await pgError(async (tx) => {
        const attemptId = await startAttempt(tx);
        await tx
          .insert(crosswordAttemptCells)
          .values({ attemptId, row: 0, col: 0, letter: "C" });
        const [a] = (
          await tx.execute(
            sql`select puzzle_id from crossword_attempts where attempt_id = ${attemptId}`,
          )
        ).rows as { puzzle_id: string }[];
        const [c] = (
          await tx.execute(
            sql`select puzzle_id from crossword_attempt_cells where attempt_id = ${attemptId}`,
          )
        ).rows as { puzzle_id: string }[];
        attemptRow = a;
        cellRow = c;
      });
      expect(attemptRow?.puzzle_id).toBe(puzzleId);
      expect(cellRow?.puzzle_id).toBe(puzzleId);
    });

    it("rejects a cell that exists only in another puzzle", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          const extra = await insertPuzzle(tx, "crossword", "t022-extra");
          await tx.insert(crosswordPuzzles).values({ ...grid, puzzleId: extra });
          await tx
            .insert(crosswordCells)
            .values({ puzzleId: extra, row: 1, col: 1, letter: "Q" });
          await tx
            .insert(crosswordAttemptCells)
            .values({ attemptId, row: 1, col: 1, letter: "Q" });
        }),
      ).toBe("23503");
    });

    it("rejects an explicit puzzle_id that is not the attempt's", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(crosswordAttemptCells).values({
            attemptId,
            puzzleId: otherPuzzleId,
            row: 0,
            col: 0,
            letter: "C",
          });
        }),
      ).toBe("23503");
    });

    it("rejects a crossword attempt for a puzzle of another type", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const other = await insertPuzzle(tx, "other", "t022-wrong");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: other })
            .returning({ id: attempts.id });
          await tx.insert(crosswordAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
    });
  });
});
