import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { content, meta } from "../../../content/reverse-chess/dev-rook-check";
import { db } from "@/db";
import { attempts, puzzles } from "@/db/schema";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import { load } from "./load";
import { reverseChessModule } from "./module";
import { contentSchema, payloadSchema } from "./schema";
import {
  reverseChessAttemptPlies,
  reverseChessAttempts,
  reverseChessPieces,
  reverseChessPuzzles,
} from "./tables";

const TYPES = sql`
  insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
  values ('reverse-chess', 'rc-test', 'rc', 'rc', 'reverse_chess_puzzles', 1),
         ('anagram', 'rc-test', 'an', 'an', 'anagram_puzzles', 2)
  on conflict (key) do nothing
`;

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('rc-test', 'rc', 99) on conflict (key) do nothing`,
  );
  await tx.execute(TYPES);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

const { pieces: _pieces, solutionPlies: _plies, ...puzzleColumns } = content;

async function insertSubtype(tx: Tx, puzzleId: string) {
  await tx
    .insert(reverseChessPuzzles)
    .values({ ...puzzleColumns, puzzleId, plyCount: 1 });
}

const piece = { file: "e", rank: 4, colour: "white", piece: "king" } as const;

describe("reverse_chess_puzzles pinning", () => {
  it("is generated as reverse-chess with a cascading composite FK", async () => {
    const { rows } = await db.execute(sql`
      select
        (select generation_expression from information_schema.columns
          where table_name = 'reverse_chess_puzzles' and column_name = 'type_key') as expr,
        (select pg_get_constraintdef(oid) from pg_constraint
          where conname = 'reverse_chess_puzzles_puzzle_id_type_key_fk') as fk
    `);
    expect(rows[0].expr).toBe("'reverse-chess'::text");
    expect(rows[0].fk).toBe(
      "FOREIGN KEY (puzzle_id, type_key) REFERENCES puzzles(id, type_key) ON DELETE CASCADE",
    );
  });

  it("accepts a subtype row for a reverse-chess puzzle", async () => {
    expect(
      await pgError(async (tx) => {
        await ensureTypes(tx);
        await insertSubtype(tx, await insertPuzzle(tx, "reverse-chess"));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await ensureTypes(tx);
        await insertSubtype(tx, await insertPuzzle(tx, "anagram"));
      }),
    ).toBe("23503");
  });

  it("rejects a reverse-chess puzzle without a subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await ensureTypes(tx);
      await insertPuzzle(tx, "reverse-chess");
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/has no row in reverse_chess_puzzles/);
  });
});

describe("reverse_chess_pieces", () => {
  async function withPuzzle(tx: Tx) {
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx, "reverse-chess");
    await insertSubtype(tx, puzzleId);
    return puzzleId;
  }

  it("rejects two pieces on one square", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx);
        await tx.insert(reverseChessPieces).values({ ...piece, puzzleId });
        await tx
          .insert(reverseChessPieces)
          .values({ ...piece, colour: "black", puzzleId });
      }),
    ).toBe("23505");
  });

  it("rejects rank 9", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx);
        await tx
          .insert(reverseChessPieces)
          .values({ ...piece, rank: 9, puzzleId });
      }),
    ).toBe("23514");
  });

  it("rejects file i", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await withPuzzle(tx);
        await tx.execute(
          sql`insert into reverse_chess_pieces (puzzle_id, file, rank, colour, piece)
              values (${puzzleId}, 'i', 4, 'white', 'king')`,
        );
      }),
    ).toBe("22P02");
  });

  it("accepts a valid piece", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await withPuzzle(tx);
        await tx.insert(reverseChessPieces).values({ ...piece, puzzleId });
      }),
    ).toBeUndefined();
  });
});

describe("reverse_chess_attempts pinning", () => {
  let userId: string;
  afterAll(deleteTestUsers);

  async function attemptFor(tx: Tx, typeKey: string) {
    userId ??= await createTestUser("t025");
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx, typeKey);
    const [attempt] = await tx
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    return attempt.id;
  }

  it("accepts attempt state for a reverse-chess attempt", async () => {
    expect(
      await pgError(async (tx) => {
        const attemptId = await attemptFor(tx, "reverse-chess");
        await tx.insert(reverseChessAttempts).values({ attemptId });
        await tx.insert(reverseChessAttemptPlies).values({
          attemptId,
          ply: 1,
          fromFile: "h",
          fromRank: 1,
          toFile: "a",
          toRank: 1,
          unpromote: false,
          special: "none",
        });
      }),
    ).toBeUndefined();
  });

  it("rejects attempt state for an attempt of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await attemptFor(tx, "anagram");
        await tx.insert(reverseChessAttempts).values({ attemptId });
      }),
    ).toBe("23503");
  });
});

describe("play payload", () => {
  let puzzleId: string;

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.slug, "t025-leak-test"));
    await db.execute(
      sql`delete from puzzle_types where key in ('reverse-chess', 'anagram') and category_key = 'rc-test'`,
    );
    await db.execute(sql`delete from puzzle_categories where key = 'rc-test'`);
  });

  it("contains no solution data", async () => {
    const parsedContent = contentSchema.parse(content);
    await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "reverse-chess",
          slug: "t025-leak-test",
          title: meta.title,
          difficulty: meta.difficulty,
        })
        .returning({ id: puzzles.id });
      puzzleId = row.id;
      await reverseChessModule.insertContent(tx, puzzleId, parsedContent);
    });

    const payload = await load(puzzleId);

    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload.pieces).toHaveLength(3);
    for (const key of [
      "solutionPlies",
      "solution_plies",
      "plies",
      "fromFile",
      "toFile",
      "uncapture",
      "unpromote",
      "special",
    ]) {
      expect(JSON.stringify(payload)).not.toContain(`"${key}"`);
    }
    expect(
      payloadSchema.strict().safeParse({ ...payload, solutionPlies: [] })
        .success,
    ).toBe(false);
  });
});
