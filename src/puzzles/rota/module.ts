import { eq } from "drizzle-orm";
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
  async insertContent(tx, puzzleId, { workers, clues, solution }) {
    await tx.insert(rotaPuzzles).values({ puzzleId });
    const insertedWorkers = await tx
      .insert(rotaWorkers)
      .values(workers.map(({ name }) => ({ name, puzzleId })))
      .returning({ id: rotaWorkers.id, name: rotaWorkers.name });
    const idOf = (name: string) => {
      const worker = insertedWorkers.find((row) => row.name === name);
      if (!worker) throw new Error(`Unknown rota worker: ${name}`);
      return worker.id;
    };
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
    const insertedClues = clues.length
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
          .returning({ id: rotaClues.id, position: rotaClues.position })
      : [];
    for (const [position, clue] of clues.entries()) {
      const clueId = insertedClues.find((row) => row.position === position)?.id;
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
    await tx
      .insert(rotaSolutions)
      .values({ puzzleId, instigatorWorkerId: idOf(solution.instigatorName) });
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
