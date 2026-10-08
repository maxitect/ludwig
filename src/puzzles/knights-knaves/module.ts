import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  knightsKnavesAttemptRoles,
  knightsKnavesAttempts,
  knightsKnavesCharacters,
  knightsKnavesPuzzles,
  knightsKnavesStatements,
} from "./tables";
import { verifyKnightsKnaves } from "./verify";

export const knightsKnavesModule = {
  schema,
  meta: { key: "knights-knaves" },
  load,
  loadSolution,
  check,
  verify: verifyKnightsKnaves,
  async upsertContent(tx, puzzleId, { questionText, characters }) {
    await tx
      .insert(knightsKnavesPuzzles)
      .values({ puzzleId, questionText })
      .onConflictDoUpdate({
        target: knightsKnavesPuzzles.puzzleId,
        set: { questionText },
      });
    await tx
      .delete(knightsKnavesCharacters)
      .where(
        and(
          eq(knightsKnavesCharacters.puzzleId, puzzleId),
          gte(knightsKnavesCharacters.position, characters.length),
        ),
      );
    await tx
      .insert(knightsKnavesCharacters)
      .values(
        characters.map(({ name, role }, position) => ({
          puzzleId,
          position,
          name,
          role,
        })),
      )
      .onConflictDoUpdate({
        target: [
          knightsKnavesCharacters.puzzleId,
          knightsKnavesCharacters.position,
        ],
        set: { name: sql`excluded.name`, role: sql`excluded.role` },
      });
    await tx
      .delete(knightsKnavesStatements)
      .where(eq(knightsKnavesStatements.puzzleId, puzzleId));
    await tx.insert(knightsKnavesStatements).values(
      characters.flatMap(({ statements }, characterPosition) =>
        statements.map(({ content }, position) => ({
          puzzleId,
          characterPosition,
          position,
          content,
        })),
      ),
    );
  },
  async replaceAttemptState(tx, attemptId, { roles }) {
    await tx
      .delete(knightsKnavesAttempts)
      .where(eq(knightsKnavesAttempts.attemptId, attemptId));
    await tx.insert(knightsKnavesAttempts).values({ attemptId });
    if (roles.length) {
      await tx.insert(knightsKnavesAttemptRoles).values(
        roles.map(({ position, role }) => ({
          attemptId,
          characterPosition: position,
          role,
        })),
      );
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(knightsKnavesAttempts)
      .where(eq(knightsKnavesAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.knightsKnavesAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        roles: {
          columns: { characterPosition: true, role: true },
          orderBy: { characterPosition: "asc" },
        },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          roles: attempt.roles.map(({ characterPosition, role }) => ({
            position: characterPosition,
            role,
          })),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
