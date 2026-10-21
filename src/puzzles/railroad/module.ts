import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  railroadAttemptCrosses,
  railroadAttemptPieces,
  railroadAttempts,
  railroadColCounts,
  railroadGivenPieces,
  railroadPuzzles,
  railroadRowCounts,
} from "./tables";
import { verifyRailroad } from "./verify";

export const railroadModule = {
  schema,
  meta: { key: "railroad" },
  load,
  loadSolution,
  check,
  verify: verifyRailroad,
  async upsertContent(tx, puzzleId, content) {
    const { rows, cols, entry, exit, rowCounts, colCounts, given } = content;
    const values = {
      rows,
      cols,
      entryRow: entry.row,
      entryCol: entry.col,
      entrySide: entry.side,
      exitRow: exit.row,
      exitCol: exit.col,
      exitSide: exit.side,
    };
    await tx
      .insert(railroadPuzzles)
      .values({ puzzleId, ...values })
      .onConflictDoUpdate({ target: railroadPuzzles.puzzleId, set: values });

    await tx
      .delete(railroadRowCounts)
      .where(
        and(
          eq(railroadRowCounts.puzzleId, puzzleId),
          gte(railroadRowCounts.row, rows),
        ),
      );
    await tx
      .insert(railroadRowCounts)
      .values(rowCounts.map((count, row) => ({ puzzleId, row, count })))
      .onConflictDoUpdate({
        target: [railroadRowCounts.puzzleId, railroadRowCounts.row],
        set: { count: sql`excluded.count` },
      });
    await tx
      .delete(railroadColCounts)
      .where(
        and(
          eq(railroadColCounts.puzzleId, puzzleId),
          gte(railroadColCounts.col, cols),
        ),
      );
    await tx
      .insert(railroadColCounts)
      .values(colCounts.map((count, col) => ({ puzzleId, col, count })))
      .onConflictDoUpdate({
        target: [railroadColCounts.puzzleId, railroadColCounts.col],
        set: { count: sql`excluded.count` },
      });

    await tx
      .delete(railroadGivenPieces)
      .where(
        given.length
          ? and(
              eq(railroadGivenPieces.puzzleId, puzzleId),
              sql`(${railroadGivenPieces.row}, ${railroadGivenPieces.col}) not in (${sql.join(
                given.map(({ row, col }) => sql`(${row}, ${col})`),
                sql`, `,
              )})`,
            )
          : eq(railroadGivenPieces.puzzleId, puzzleId),
      );
    if (given.length) {
      await tx
        .insert(railroadGivenPieces)
        .values(given.map((piece) => ({ ...piece, puzzleId })))
        .onConflictDoUpdate({
          target: [
            railroadGivenPieces.puzzleId,
            railroadGivenPieces.row,
            railroadGivenPieces.col,
          ],
          set: { piece: sql`excluded.piece` },
        });
    }
  },
  async replaceAttemptState(tx, attemptId, { pieces, crosses }) {
    await tx
      .delete(railroadAttempts)
      .where(eq(railroadAttempts.attemptId, attemptId));
    await tx.insert(railroadAttempts).values({ attemptId });
    if (pieces.length) {
      await tx
        .insert(railroadAttemptPieces)
        .values(pieces.map((piece) => ({ ...piece, attemptId })));
    }
    if (crosses.length) {
      await tx
        .insert(railroadAttemptCrosses)
        .values(crosses.map((cross) => ({ ...cross, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(railroadAttempts)
      .where(eq(railroadAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.railroadAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        pieces: { columns: { row: true, col: true, piece: true } },
        crosses: { columns: { row: true, col: true } },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
