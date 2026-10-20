import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  chessProblemAttemptPlies,
  chessProblemAttempts,
  chessProblemPieces,
  chessProblemPuzzles,
} from "./tables";
import { verifyChessProblem } from "./verify";

export const chessProblemModule = {
  schema,
  meta: { key: "chess-problem" },
  load,
  loadSolution,
  check,
  verify: verifyChessProblem,
  async upsertContent(tx, puzzleId, { pieces, ...columns }) {
    await tx
      .insert(chessProblemPuzzles)
      .values({ ...columns, puzzleId })
      .onConflictDoUpdate({
        target: chessProblemPuzzles.puzzleId,
        set: columns,
      });
    await tx
      .delete(chessProblemPieces)
      .where(eq(chessProblemPieces.puzzleId, puzzleId));
    await tx
      .insert(chessProblemPieces)
      .values(pieces.map((piece) => ({ ...piece, puzzleId })));
  },
  async replaceAttemptState(tx, attemptId, { plies }) {
    await tx
      .delete(chessProblemAttempts)
      .where(eq(chessProblemAttempts.attemptId, attemptId));
    await tx.insert(chessProblemAttempts).values({ attemptId });
    if (!plies.length) return;
    await tx.insert(chessProblemAttemptPlies).values(
      plies.map((ply, index) => ({
        ...ply,
        promotion: ply.promotion ?? null,
        attemptId,
        ply: index + 1,
      })),
    );
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(chessProblemAttempts)
      .where(eq(chessProblemAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.chessProblemAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        plies: {
          columns: {
            fromFile: true,
            fromRank: true,
            toFile: true,
            toRank: true,
            promotion: true,
          },
          orderBy: { ply: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
