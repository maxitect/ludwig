import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  reverseChessAttemptPlies,
  reverseChessAttempts,
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
  check() {
    throw new Error("Reverse Chess checking is implemented in T029");
  },
  verify: verifyReverseChess,
  Solver: null,
  async insertContent(tx, puzzleId, { pieces, solutionPlies, ...puzzle }) {
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...puzzle, puzzleId, plyCount: solutionPlies.length });
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
} satisfies PuzzleTypeModule<typeof schema, schema.SolutionPly[]>;
