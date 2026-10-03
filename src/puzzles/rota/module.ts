import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  rotaAttemptSwaps,
  rotaAttempts,
  rotaClueMaxSwaps,
  rotaClueNeverInRank,
  rotaClueUnpoweredSquare,
  rotaClues,
  rotaPuzzles,
  rotaSolutionSwaps,
  rotaSolutions,
  rotaWorkerSquares,
  rotaWorkers,
} from "./tables";

export const rotaModule = {
  schema,
  meta: { key: "rota" },
  load,
  loadSolution,
  check,
  async upsertContent(tx, puzzleId, { workers, clues, solution }) {
    await tx.insert(rotaPuzzles).values({ puzzleId }).onConflictDoNothing();
    await tx
      .insert(rotaWorkers)
      .values(workers.map(({ name }) => ({ name, puzzleId })))
      .onConflictDoNothing();
    const storedWorkers = await tx
      .select({ id: rotaWorkers.id, name: rotaWorkers.name })
      .from(rotaWorkers)
      .where(eq(rotaWorkers.puzzleId, puzzleId));
    const idOf = (name: string) => {
      const worker = storedWorkers.find((row) => row.name === name);
      if (!worker) throw new Error(`Unknown rota worker: ${name}`);
      return worker.id;
    };

    await tx
      .delete(rotaWorkerSquares)
      .where(eq(rotaWorkerSquares.puzzleId, puzzleId));
    await tx
      .delete(rotaSolutionSwaps)
      .where(eq(rotaSolutionSwaps.puzzleId, puzzleId));
    await tx.insert(rotaWorkerSquares).values(
      workers.flatMap(({ name, intended, final }) => [
        {
          ...intended,
          phase: "intended" as const,
          puzzleId,
          workerId: idOf(name),
        },
        { ...final, phase: "final" as const, puzzleId, workerId: idOf(name) },
      ]),
    );

    const storedClues = await tx
      .select({ id: rotaClues.id, position: rotaClues.position, kind: rotaClues.kind })
      .from(rotaClues)
      .where(eq(rotaClues.puzzleId, puzzleId));
    const staleClueIds = storedClues
      .filter(
        ({ position, kind }) => clues[position]?.kind !== kind,
      )
      .map(({ id }) => id);
    if (staleClueIds.length) {
      await tx.delete(rotaClues).where(inArray(rotaClues.id, staleClueIds));
    }
    const upsertedClues = clues.length
      ? await tx
          .insert(rotaClues)
          .values(
            clues.map(({ kind, displayText }, position) => ({
              puzzleId,
              position,
              kind,
              displayText,
            })),
          )
          .onConflictDoUpdate({
            target: [rotaClues.puzzleId, rotaClues.position],
            set: { displayText: sql`excluded.display_text` },
          })
          .returning({ id: rotaClues.id, position: rotaClues.position })
      : [];
    const clueIds = upsertedClues.map(({ id }) => id);
    if (clueIds.length) {
      await tx
        .delete(rotaClueUnpoweredSquare)
        .where(inArray(rotaClueUnpoweredSquare.clueId, clueIds));
      await tx
        .delete(rotaClueNeverInRank)
        .where(inArray(rotaClueNeverInRank.clueId, clueIds));
      await tx
        .delete(rotaClueMaxSwaps)
        .where(inArray(rotaClueMaxSwaps.clueId, clueIds));
    }
    for (const [position, clue] of clues.entries()) {
      const clueId = upsertedClues.find((row) => row.position === position)?.id;
      if (!clueId) throw new Error(`Rota clue not inserted: ${position}`);
      if (clue.kind === "unpowered_square") {
        await tx
          .insert(rotaClueUnpoweredSquare)
          .values({ clueId, file: clue.file, rank: clue.rank });
      } else if (clue.kind === "never_in_rank") {
        await tx.insert(rotaClueNeverInRank).values({
          clueId,
          workerId: idOf(clue.workerName),
          rank: clue.rank,
        });
      } else if (clue.kind === "max_swaps") {
        await tx
          .insert(rotaClueMaxSwaps)
          .values({ clueId, maxSwaps: clue.maxSwaps });
      }
    }

    const instigatorWorkerId = idOf(solution.instigatorName);
    await tx
      .insert(rotaSolutions)
      .values({ puzzleId, instigatorWorkerId })
      .onConflictDoUpdate({
        target: rotaSolutions.puzzleId,
        set: { instigatorWorkerId },
      });
    await tx.delete(rotaWorkers).where(
      and(
        eq(rotaWorkers.puzzleId, puzzleId),
        notInArray(
          rotaWorkers.name,
          workers.map(({ name }) => name),
        ),
      ),
    );
    await tx.insert(rotaSolutionSwaps).values(
      solution.swaps.map(({ a, b }, index) => ({
        puzzleId,
        step: index + 1,
        workerAId: idOf(a),
        workerBId: idOf(b),
      })),
    );
  },
  async replaceAttemptState(tx, attemptId, { swaps, instigatorWorkerId }) {
    await tx.delete(rotaAttempts).where(eq(rotaAttempts.attemptId, attemptId));
    await tx.insert(rotaAttempts).values({ attemptId, instigatorWorkerId });
    if (!swaps.length) return;
    await tx
      .insert(rotaAttemptSwaps)
      .values(
        swaps.map((swap, index) => ({ ...swap, attemptId, step: index + 1 })),
      );
  },
  async clearAttemptState(attemptId) {
    await db.delete(rotaAttempts).where(eq(rotaAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.rotaAttempts.findFirst({
      where: { attemptId },
      columns: { instigatorWorkerId: true },
      with: {
        swaps: {
          columns: { workerAId: true, workerBId: true },
          orderBy: { step: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
