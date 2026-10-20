import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { checkPuzzleAnswer } from "@/lib/data/puzzles";
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
  chessProblemAttemptPlies,
  chessProblemAttempts,
  chessProblemPieces,
  chessProblemPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { content as quietWord } from "../../../content/chess-problem/a-quiet-word";
import { content as openFile } from "../../../content/chess-problem/open-file";
import { chessProblemModule } from "./module";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { contentSchema, payloadSchema } from "./schema";

const quiet = contentSchema.parse(quietWord);
const open = contentSchema.parse(openFile);

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('cp-test', 'cp', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('chess-problem', 'cp-test', 'cp', 'cp', 'chess_problem_puzzles', 1),
           ('other', 'cp-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const subtype = (puzzleId: string) => ({
  puzzleId,
  mateIn: 1,
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
});

describe("chess problem tables", () => {
  it("stores no solution, json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'chess_problem%'
        and (data_type in ('jsonb', 'json', 'ARRAY') or column_name ~ 'solution|key_move|line')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(chessProblemPuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a chess problem with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "chess-problem");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in chess_problem_puzzles/);
  });

  it.each([0, 3])("rejects mate_in %i", async (mateIn) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "chess-problem");
        await tx
          .insert(chessProblemPuzzles)
          .values({ ...subtype(puzzleId), mateIn });
      }),
    ).toBe("23514");
  });

  it.each([1, 2])("accepts mate_in %i", async (mateIn) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "chess-problem");
        await tx
          .insert(chessProblemPuzzles)
          .values({ ...subtype(puzzleId), mateIn });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a piece off the board and a second piece on a square", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "chess-problem");
        await tx.insert(chessProblemPuzzles).values(subtype(puzzleId));
        await tx.insert(chessProblemPieces).values({
          puzzleId,
          file: "a",
          rank: 9,
          colour: "white",
          piece: "king",
        });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "chess-problem");
        await tx.insert(chessProblemPuzzles).values(subtype(puzzleId));
        const piece = {
          puzzleId,
          file: "a" as const,
          rank: 1,
          colour: "white" as const,
          piece: "king" as const,
        };
        await tx.insert(chessProblemPieces).values([piece, piece]);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another type and a fourth ply", async () => {
    const userId = await createTestUser("t085tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(chessProblemAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "chess-problem");
        await tx.insert(chessProblemPuzzles).values(subtype(puzzleId));
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(chessProblemAttempts).values({ attemptId: attempt.id });
        await tx.insert(chessProblemAttemptPlies).values({
          attemptId: attempt.id,
          ply: 4,
          fromFile: "a",
          fromRank: 1,
          toFile: "a",
          toRank: 2,
        });
      }),
    ).toBe("23514");
  });
});

describe("chess problem module", () => {
  let puzzleId: string;
  let openId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "cp-test", name: "cp", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "chess-problem",
        categoryKey: "cp-test",
        name: "cp",
        description: "cp",
        subtypeTable: "chess_problem_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    [puzzleId, openId] = await db.transaction(async (tx) => {
      const ids: string[] = [];
      for (const [slug, content] of [
        ["t085-quiet", quiet],
        ["t085-open", open],
      ] as const) {
        const [row] = await tx
          .insert(puzzles)
          .values({ typeKey: "chess-problem", slug, title: slug, difficulty: 1 })
          .returning({ id: puzzles.id });
        await chessProblemModule.upsertContent(tx, row.id, content);
        ids.push(row.id);
      }
      return ids;
    });
    userId = await createTestUser("t085mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    await db.delete(puzzles).where(eq(puzzles.id, openId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload that carries no key move and no line", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).toSorted()).toEqual([
      "blackKingside",
      "blackQueenside",
      "enPassantFile",
      "mateIn",
      "pieces",
      "whiteKingside",
      "whiteQueenside",
    ]);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, keys: [{ from: "c2" }] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: ["Qc6"] }),
    ).toThrow();
  });

  it("solves the position when asked for the solution", async () => {
    const { keys } = await loadSolution(puzzleId);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({ from: "c2", to: "c6" });
  });

  it("accepts the line, and names the first ply of a wrong first move", async () => {
    const ply = (from: string, to: string) => ({
      fromFile: from[0] as "a",
      fromRank: Number(from[1]),
      toFile: to[0] as "a",
      toRank: Number(to[1]),
      promotion: null,
    });
    const right = await checkPuzzleAnswer("chess-problem", puzzleId, {
      plies: [ply("c2", "c6"), ply("b8", "a7"), ply("c6", "b7")],
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("chess-problem", puzzleId, {
      plies: [ply("c2", "c7"), ply("b8", "a8"), ply("c7", "a7")],
    });
    expect(wrong).toMatchObject({ correct: false, wrongParts: [{ ply: 1 }] });
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await chessProblemModule.loadAttemptState(attempt.id)).toBeNull();
    const plies = [
      { fromFile: "c", fromRank: 2, toFile: "c", toRank: 6, promotion: null },
      { fromFile: "b", fromRank: 8, toFile: "a", toRank: 7, promotion: null },
    ] as const;
    await db.transaction((tx) =>
      chessProblemModule.replaceAttemptState(tx, attempt.id, {
        plies: [...plies],
      }),
    );
    expect(await chessProblemModule.loadAttemptState(attempt.id)).toEqual({
      plies,
    });
    await chessProblemModule.clearAttemptState(attempt.id);
    expect(await chessProblemModule.loadAttemptState(attempt.id)).toBeNull();
  });

  it("updates the position in place", async () => {
    await db.transaction((tx) =>
      chessProblemModule.upsertContent(tx, puzzleId, open),
    );
    expect(await load(puzzleId)).toMatchObject({ mateIn: 1 });
    await db.transaction((tx) =>
      chessProblemModule.upsertContent(tx, puzzleId, quiet),
    );
    expect(await load(puzzleId)).toMatchObject({ mateIn: 2 });
  });
});
