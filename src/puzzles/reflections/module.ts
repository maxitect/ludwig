import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  reflectionsAttemptMirrors,
  reflectionsAttempts,
  reflectionsFixedMirrors,
  reflectionsPorts,
  reflectionsPuzzles,
  reflectionsSlots,
} from "./tables";
import { verifyReflections } from "./verify";

const cellList = (cells: readonly { row: number; col: number }[]) =>
  sql.join(
    cells.map(({ row, col }) => sql`(${row}, ${col})`),
    sql`, `,
  );

export const reflectionsModule = {
  schema,
  meta: { key: "reflections" },
  load,
  loadSolution,
  check,
  verify: verifyReflections,
  async upsertContent(tx, puzzleId, content) {
    const { rows, cols, fixedMirrors, slots, ports } = content;
    await tx
      .insert(reflectionsPuzzles)
      .values({ puzzleId, rows, cols })
      .onConflictDoUpdate({
        target: reflectionsPuzzles.puzzleId,
        set: { rows: sql`excluded.rows`, cols: sql`excluded.cols` },
      });

    await tx
      .delete(reflectionsFixedMirrors)
      .where(
        fixedMirrors.length
          ? and(
              eq(reflectionsFixedMirrors.puzzleId, puzzleId),
              sql`(${reflectionsFixedMirrors.row}, ${reflectionsFixedMirrors.col}) not in (${cellList(fixedMirrors)})`,
            )
          : eq(reflectionsFixedMirrors.puzzleId, puzzleId),
      );
    if (fixedMirrors.length) {
      await tx
        .insert(reflectionsFixedMirrors)
        .values(fixedMirrors.map((mirror) => ({ ...mirror, puzzleId })))
        .onConflictDoUpdate({
          target: [
            reflectionsFixedMirrors.puzzleId,
            reflectionsFixedMirrors.row,
            reflectionsFixedMirrors.col,
          ],
          set: { mirror: sql`excluded.mirror` },
        });
    }

    await tx
      .delete(reflectionsSlots)
      .where(
        slots.length
          ? and(
              eq(reflectionsSlots.puzzleId, puzzleId),
              sql`(${reflectionsSlots.row}, ${reflectionsSlots.col}) not in (${cellList(slots)})`,
            )
          : eq(reflectionsSlots.puzzleId, puzzleId),
      );
    if (slots.length) {
      await tx
        .insert(reflectionsSlots)
        .values(slots.map((slot) => ({ ...slot, puzzleId })))
        .onConflictDoNothing();
    }

    await tx
      .delete(reflectionsPorts)
      .where(
        ports.length
          ? and(
              eq(reflectionsPorts.puzzleId, puzzleId),
              sql`(${reflectionsPorts.side}::text, ${reflectionsPorts.offset}) not in (${sql.join(
                ports.map(({ side, offset }) => sql`(${side}, ${offset})`),
                sql`, `,
              )})`,
            )
          : eq(reflectionsPorts.puzzleId, puzzleId),
      );
    if (ports.length) {
      await tx
        .insert(reflectionsPorts)
        .values(ports.map((port) => ({ ...port, puzzleId })))
        .onConflictDoUpdate({
          target: [
            reflectionsPorts.puzzleId,
            reflectionsPorts.side,
            reflectionsPorts.offset,
          ],
          set: { label: sql`excluded.label` },
        });
    }
  },
  async replaceAttemptState(tx, attemptId, { mirrors }) {
    await tx
      .delete(reflectionsAttempts)
      .where(eq(reflectionsAttempts.attemptId, attemptId));
    await tx.insert(reflectionsAttempts).values({ attemptId });
    if (mirrors.length) {
      await tx
        .insert(reflectionsAttemptMirrors)
        .values(mirrors.map((mirror) => ({ ...mirror, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(reflectionsAttempts)
      .where(eq(reflectionsAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.reflectionsAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { mirrors: { columns: { row: true, col: true, mirror: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
