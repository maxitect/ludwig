import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { content as proofContent } from "../../../content/reverse-chess/two-promotions";
import { content as unwind } from "./fixtures/dev-unwind";
import { content, meta } from "./fixtures/content/reverse-chess/dev-rook-check";
import { db } from "@/db";
import { attempts, puzzles } from "@/db/schema";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  rolledBack,
  type Tx,
} from "@/db/integrity/harness";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { reverseChessModule } from "./module";
import { contentSchema, payloadSchema, type Content } from "./schema";
import {
  reverseChessAttemptPlies,
  reverseChessAttempts,
  reverseChessGoalCastlingRight,
  reverseChessGoalPieceCount,
  reverseChessGoalPieceOnSquare,
  reverseChessGoals,
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
const unwindColumns = {
  mode: unwind.mode,
  sideToMove: unwind.sideToMove,
  whiteKingside: unwind.whiteKingside,
  whiteQueenside: unwind.whiteQueenside,
  blackKingside: unwind.blackKingside,
  blackQueenside: unwind.blackQueenside,
  halfmove: unwind.halfmove,
  fullmove: unwind.fullmove,
};

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

describe("reverse_chess_goals", () => {
  async function unwindPuzzle(tx: Tx) {
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx, "reverse-chess");
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...unwindColumns, puzzleId, plyCount: 2 });
    return puzzleId;
  }

  const square = {
    colour: "black",
    piece: "pawn",
    file: "a",
    rank: 7,
  } as const;

  async function addGoal(tx: Tx, puzzleId: string) {
    await tx
      .insert(reverseChessGoals)
      .values({ puzzleId, kind: "piece_on_square", displayText: "goal" });
    await tx
      .insert(reverseChessGoalPieceOnSquare)
      .values({ ...square, puzzleId });
  }

  it("commits an unwind puzzle with a goal and its subtype row", async () => {
    expect(
      await pgError(async (tx) => {
        await addGoal(tx, await unwindPuzzle(tx));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a goal without its subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await unwindPuzzle(tx);
      await tx
        .insert(reverseChessGoals)
        .values({ puzzleId, kind: "castling_right", displayText: "goal" });
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/of kind castling_right has no subtype row/);
  });

  it("rejects a subtype row of another kind than the goal", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await unwindPuzzle(tx);
        await tx
          .insert(reverseChessGoals)
          .values({ puzzleId, kind: "piece_on_square", displayText: "goal" });
        await tx.insert(reverseChessGoalCastlingRight).values({
          puzzleId,
          colour: "white",
          side: "kingside",
        });
      }),
    ).toBe("23503");
  });

  it("rejects an unwind puzzle without a goal at commit", async () => {
    const error = await pgError(async (tx) => {
      await unwindPuzzle(tx);
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/in mode unwind must have a goal/);
  });

  it("rejects a goal on a last_move puzzle at commit", async () => {
    const error = await pgError(async (tx) => {
      await ensureTypes(tx);
      const puzzleId = await insertPuzzle(tx, "reverse-chess");
      await insertSubtype(tx, puzzleId);
      await addGoal(tx, puzzleId);
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/in mode last_move must not have a goal/);
  });

  it("rejects deleting the goal of an unwind puzzle at commit", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await unwindPuzzle(tx);
      await addGoal(tx, puzzleId);
      await forceDeferred(tx);
      await tx
        .delete(reverseChessGoals)
        .where(eq(reverseChessGoals.puzzleId, puzzleId));
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/in mode unwind must have a goal/);
  });

  it("rejects switching a last_move puzzle to unwind without a goal at commit", async () => {
    const error = await pgError(async (tx) => {
      await ensureTypes(tx);
      const puzzleId = await insertPuzzle(tx, "reverse-chess");
      await insertSubtype(tx, puzzleId);
      await forceDeferred(tx);
      await tx
        .update(reverseChessPuzzles)
        .set({ mode: "unwind" })
        .where(eq(reverseChessPuzzles.puzzleId, puzzleId));
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/in mode unwind must have a goal/);
  });

  it("rejects a rank outside 1 to 8", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await unwindPuzzle(tx);
        await tx
          .insert(reverseChessGoals)
          .values({ puzzleId, kind: "piece_on_square", displayText: "goal" });
        await tx
          .insert(reverseChessGoalPieceOnSquare)
          .values({ ...square, rank: 9, puzzleId });
      }),
    ).toBe("23514");
  });

  it("is replaced in place when the content is seeded again", async () => {
    const castling: Content = {
      ...unwind,
      goal: {
        kind: "castling_right",
        displayText: "Before black last castled",
        colour: "black",
        side: "queenside",
      },
    };
    const stored = await rolledBack(async (tx) => {
      await ensureTypes(tx);
      const puzzleId = await insertPuzzle(tx, "reverse-chess");
      await reverseChessModule.upsertContent(tx, puzzleId, unwind);
      await reverseChessModule.upsertContent(tx, puzzleId, castling);
      return tx.execute(sql`
        select g.kind, g.display_text,
          (select count(*)::int from reverse_chess_goal_piece_on_square) as squares,
          (select count(*)::int from reverse_chess_goal_castling_right) as castles
        from reverse_chess_goals g where g.puzzle_id = ${puzzleId}`);
    });
    expect(stored.rows).toEqual([
      {
        kind: "castling_right",
        display_text: "Before black last castled",
        squares: 0,
        castles: 1,
      },
    ]);
  });
});

describe("initial_position goal", () => {
  const columns = { ...unwindColumns, sideToMove: "white", fullmove: 6 } as const;

  async function proofGame(tx: Tx, plyCount: number, kind = "initial_position" as const) {
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx, "reverse-chess");
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...columns, puzzleId, plyCount });
    await tx
      .insert(reverseChessGoals)
      .values({ puzzleId, kind, displayText: "Back to the starting position" });
    return puzzleId;
  }

  it("commits with no subtype row and a ply_count that matches the position", async () => {
    expect(
      await pgError(async (tx) => {
        await proofGame(tx, 10);
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("commits a Black to move position whose ply_count is odd", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await proofGame(tx, 11);
        await tx
          .update(reverseChessPuzzles)
          .set({ sideToMove: "black" })
          .where(eq(reverseChessPuzzles.puzzleId, puzzleId));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a ply_count that disagrees with the move number at commit", async () => {
    const error = await pgError(async (tx) => {
      await proofGame(tx, 9);
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/has ply_count 9 but its initial_position goal needs 10/);
  });

  it("rejects changing the side to move so ply_count no longer matches", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await proofGame(tx, 10);
      await forceDeferred(tx);
      await tx
        .update(reverseChessPuzzles)
        .set({ sideToMove: "black" })
        .where(eq(reverseChessPuzzles.puzzleId, puzzleId));
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/needs 11/);
  });

  it("leaves other goal kinds free of the ply_count rule", async () => {
    expect(
      await pgError(async (tx) => {
        const puzzleId = await unwindPuzzleFor(tx);
        await tx
          .insert(reverseChessGoals)
          .values({ puzzleId, kind: "piece_count", displayText: "goal" });
        await tx
          .insert(reverseChessGoalPieceCount)
          .values({ puzzleId, colour: "black", piece: "pawn", count: 8 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("still rejects a piece_count goal without its subtype row", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await unwindPuzzleFor(tx);
      await tx
        .insert(reverseChessGoals)
        .values({ puzzleId, kind: "piece_count", displayText: "goal" });
      await forceDeferred(tx);
    });
    expect(error?.message).toMatch(/of kind piece_count has no subtype row/);
  });

  async function unwindPuzzleFor(tx: Tx) {
    await ensureTypes(tx);
    const puzzleId = await insertPuzzle(tx, "reverse-chess");
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...unwindColumns, puzzleId, plyCount: 2 });
    return puzzleId;
  }

  it("is seeded with no subtype row and keeps its goal on re-seed", async () => {
    const stored = await rolledBack(async (tx) => {
      await ensureTypes(tx);
      const puzzleId = await insertPuzzle(tx, "reverse-chess");
      await reverseChessModule.upsertContent(tx, puzzleId, proofContent);
      await reverseChessModule.upsertContent(tx, puzzleId, proofContent);
      return tx.execute(sql`
        select g.kind, p.ply_count,
          (select count(*)::int from reverse_chess_goal_piece_on_square) as squares
        from reverse_chess_goals g
        join reverse_chess_puzzles p using (puzzle_id)
        where g.puzzle_id = ${puzzleId}`);
    });
    expect(stored.rows).toEqual([
      { kind: "initial_position", ply_count: 10, squares: 0 },
    ]);
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
    await db.delete(puzzles).where(eq(puzzles.slug, "t030-goal-leak-test"));
    await db.delete(puzzles).where(eq(puzzles.slug, "t025-leak-test"));
    await db.delete(puzzles).where(eq(puzzles.slug, "t081-proof-leak-test"));
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
      await reverseChessModule.upsertContent(tx, puzzleId, parsedContent);
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

  it("shows the goal text but never its predicate", async () => {
    const parsedContent = contentSchema.parse(unwind);
    let unwindId = "";
    await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "reverse-chess",
          slug: "t030-goal-leak-test",
          title: "goal",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      unwindId = row.id;
      await reverseChessModule.upsertContent(tx, unwindId, parsedContent);
    });

    const payload = await load(unwindId);

    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload.goalText).toBe(unwind.goal.displayText);
    expect(JSON.stringify(payload)).not.toContain("piece_on_square");
    expect(JSON.stringify(payload)).not.toContain('"goal"');

    const solution = await loadSolution(unwindId);
    expect(solution.plies).toHaveLength(2);
    expect(solution.goal).toEqual({
      kind: "piece_on_square",
      colour: "black",
      piece: "pawn",
      file: "a",
      rank: 7,
    });
  });

  it("shows a proof game's position, ply count and goal text but no plies", async () => {
    let proofId = "";
    await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "reverse-chess",
          slug: "t081-proof-leak-test",
          title: "proof",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      proofId = row.id;
      await reverseChessModule.upsertContent(tx, proofId, proofContent);
    });

    const payload = await load(proofId);

    expect(payloadSchema.strict().safeParse(payload).success).toBe(true);
    expect(payload.plyCount).toBe(10);
    expect(payload.goalText).toBe("Back to the starting position");
    expect(payload.pieces.length).toBeGreaterThan(0);
    expect(JSON.stringify(payload)).not.toContain("initial_position");
    for (const key of ["solutionPlies", "plies", "fromFile", "toFile", "uncapture"]) {
      expect(JSON.stringify(payload)).not.toContain(`"${key}"`);
    }
    expect((await loadSolution(proofId)).goal).toEqual({ kind: "initial_position" });
  });
});
