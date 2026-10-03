import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  reverseChessAttemptPlies,
  reverseChessAttempts,
  reverseChessGoalCastlingRight,
  reverseChessGoalPieceCount,
  reverseChessGoalPieceOnSquare,
  reverseChessGoals,
  reverseChessPieces,
  reverseChessPuzzles,
  reverseChessSolutionPlies,
} from "./tables";
import { verifyReverseChess } from "./verify";

export const reverseChessModule = {
  schema,
  meta: { key: "reverse-chess" },
  load,
  loadSolution,
  check,
  verify: verifyReverseChess,
  async upsertContent(tx, puzzleId, { pieces, solutionPlies, goal, ...puzzle }) {
    const columns = {
      mode: puzzle.mode,
      sideToMove: puzzle.sideToMove,
      whiteKingside: puzzle.whiteKingside,
      whiteQueenside: puzzle.whiteQueenside,
      blackKingside: puzzle.blackKingside,
      blackQueenside: puzzle.blackQueenside,
      enPassantFile: puzzle.enPassantFile ?? null,
      halfmove: puzzle.halfmove,
      fullmove: puzzle.fullmove,
      plyCount: solutionPlies.length,
    };
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...columns, puzzleId })
      .onConflictDoUpdate({
        target: reverseChessPuzzles.puzzleId,
        set: columns,
      });
    await tx
      .delete(reverseChessGoals)
      .where(eq(reverseChessGoals.puzzleId, puzzleId));
    if (goal) {
      const { displayText, ...params } = goal;
      await tx
        .insert(reverseChessGoals)
        .values({ puzzleId, kind: params.kind, displayText });
      if (params.kind === "piece_on_square") {
        const { kind: _, ...row } = params;
        await tx
          .insert(reverseChessGoalPieceOnSquare)
          .values({ ...row, puzzleId });
      } else if (params.kind === "castling_right") {
        const { kind: _, ...row } = params;
        await tx
          .insert(reverseChessGoalCastlingRight)
          .values({ ...row, puzzleId });
      } else {
        const { kind: _, ...row } = params;
        await tx.insert(reverseChessGoalPieceCount).values({ ...row, puzzleId });
      }
    }
    await tx
      .delete(reverseChessPieces)
      .where(eq(reverseChessPieces.puzzleId, puzzleId));
    await tx
      .delete(reverseChessSolutionPlies)
      .where(eq(reverseChessSolutionPlies.puzzleId, puzzleId));
    await tx
      .insert(reverseChessPieces)
      .values(pieces.map((piece) => ({ ...piece, puzzleId })));
    await tx.insert(reverseChessSolutionPlies).values(
      solutionPlies.map((ply, index) => ({
        ...ply,
        puzzleId,
        ply: index + 1,
      })),
    );
  },
  async replaceAttemptState(tx, attemptId, { plies }) {
    await tx
      .delete(reverseChessAttempts)
      .where(eq(reverseChessAttempts.attemptId, attemptId));
    await tx.insert(reverseChessAttempts).values({ attemptId });
    if (!plies.length) return;
    await tx.insert(reverseChessAttemptPlies).values(
      plies.map((ply, index) => ({ ...ply, attemptId, ply: index + 1 })),
    );
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(reverseChessAttempts)
      .where(eq(reverseChessAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.reverseChessAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        plies: {
          columns: {
            fromFile: true,
            fromRank: true,
            toFile: true,
            toRank: true,
            uncapture: true,
            unpromote: true,
            special: true,
          },
          orderBy: { ply: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
