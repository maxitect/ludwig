import "server-only";
import { and, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { z } from "zod";
import type { db as appDb } from "@/db";
import { puzzleInsertSchema, puzzles, volumes } from "@/db/schema/core";
import type { PuzzleRegistry, Tx } from "@/puzzles/registry";

type Db = typeof appDb;

export const contentMetaSchema = puzzleInsertSchema
  .pick({
    slug: true,
    title: true,
    difficulty: true,
    sourceNote: true,
    publishedAt: true,
    volumePosition: true,
  })
  .extend({ volume: z.string().optional() });

type ContentMeta = z.infer<typeof contentMetaSchema>;

/**
 * Writes one puzzle (supertype, subtype and children) in a single transaction, updating an
 * existing `(type_key, slug)` in place so content row ids stay stable and attempt data is never
 * touched. A content change that removes a row attempt data references fails the whole puzzle.
 * Inside a transaction it runs as a savepoint.
 */
export async function upsertPuzzle(
  db: Db | Tx,
  registry: PuzzleRegistry,
  {
    typeKey,
    meta: { volume, ...columns },
    content,
  }: { typeKey: string; meta: ContentMeta; content: unknown },
) {
  try {
    return await writePuzzle(db, registry, typeKey, volume, columns, content);
  } catch (error) {
    const cause = error instanceof Error && error.cause ? error.cause : error;
    if (isAttemptReferenceViolation(cause)) {
      throw new Error(
        `${typeKey}/${columns.slug}: content change removes a row that attempt data references (${cause.constraint}); restore it or delete the affected attempts deliberately`,
      );
    }
    throw error;
  }
}

function isAttemptReferenceViolation(error: unknown): error is DatabaseError {
  return (
    error instanceof DatabaseError &&
    error.code === "23503" &&
    error.message.startsWith("update or delete on table") &&
    (error.table ?? "").includes("attempt")
  );
}

async function writePuzzle(
  db: Db | Tx,
  registry: PuzzleRegistry,
  typeKey: string,
  volume: ContentMeta["volume"],
  columns: Omit<ContentMeta, "volume">,
  content: unknown,
) {
  return db.transaction(async (tx) => {
    const volumeId = volume
      ? (
          await tx
            .select({ id: volumes.id })
            .from(volumes)
            .where(eq(volumes.slug, volume))
        )[0]?.id
      : null;
    if (volume && !volumeId) throw new Error(`unknown volume "${volume}"`);

    const values = {
      ...columns,
      volumePosition: volumeId ? (columns.volumePosition ?? null) : null,
      sourceNote: columns.sourceNote ?? null,
      publishedAt: columns.publishedAt ?? null,
      volumeId,
    };
    const [existing] = await tx
      .select({ id: puzzles.id })
      .from(puzzles)
      .where(and(eq(puzzles.typeKey, typeKey), eq(puzzles.slug, columns.slug)));

    let puzzleId: string;
    if (existing) {
      puzzleId = existing.id;
      await tx.update(puzzles).set(values).where(eq(puzzles.id, puzzleId));
    } else {
      [{ id: puzzleId }] = await tx
        .insert(puzzles)
        .values({ ...values, typeKey })
        .returning({ id: puzzles.id });
    }

    await registry[typeKey].upsertContent(tx, puzzleId, content);
    return { id: puzzleId, inserted: !existing };
  });
}
