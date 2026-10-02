import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import {
  createTestUser,
  deleteTestUsers,
  rolledBack,
} from "@/db/integrity/harness";
import {
  attempts,
  gearAttemptSwaps,
  gearAttempts,
  gearPuzzleGears,
  gearPuzzles,
  puzzles,
} from "@/db/schema";
import { gearsModule } from "./module";

afterAll(deleteTestUsers);

describe("gears replaceAttemptState", () => {
  it("replaces the attempt row and swaps instead of appending", async () => {
    const userId = await createTestUser("t033st");
    const stored = await rolledBack(async (tx) => {
      await tx.execute(
        sql`insert into puzzle_categories (key, name, sort) values ('gear-st', 'gs', 99) on conflict (key) do nothing`,
      );
      await tx.execute(sql`
        insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
        values ('gears', 'gear-st', 'gears', 'gears', 'gear_puzzles', 1)
        on conflict (key) do nothing`);
      const [puzzle] = await tx
        .insert(puzzles)
        .values({ typeKey: "gears", slug: "t033", title: "t", difficulty: 1 })
        .returning({ id: puzzles.id });
      await tx.insert(gearPuzzles).values({
        puzzleId: puzzle.id,
        slotCount: 8,
        mIn: 3,
        mOut: 1,
        maxAdjustments: 2,
        occlusion: false,
      });
      const gear = (label: string, isDriver: boolean) => ({
        puzzleId: puzzle.id,
        label,
        teeth: 12,
        startSlot: 0,
        initialOffset: 0,
        halfWidthDeg: 45,
        isDriver,
      });
      const [a, b, c] = await tx
        .insert(gearPuzzleGears)
        .values([gear("a", true), gear("b", false), gear("c", false)])
        .returning({ id: gearPuzzleGears.id });
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId: puzzle.id })
        .returning({ id: attempts.id });

      await gearsModule.replaceAttemptState(tx, attempt.id, {
        crank: 4,
        convergence: 2,
        accusedGearId: a.id,
        swaps: [
          { gearAId: a.id, gearBId: b.id },
          { gearAId: c.id, gearBId: b.id },
        ],
      });
      await gearsModule.replaceAttemptState(tx, attempt.id, {
        crank: 9,
        convergence: null,
        accusedGearId: null,
        swaps: [{ gearAId: a.id, gearBId: c.id }],
      });
      const rows = await tx
        .select({
          crank: gearAttempts.crank,
          convergence: gearAttempts.convergence,
          accused: gearAttempts.accusedGearId,
        })
        .from(gearAttempts)
        .where(eq(gearAttempts.attemptId, attempt.id));
      const swaps = await tx
        .select({ a: gearAttemptSwaps.gearAId, b: gearAttemptSwaps.gearBId })
        .from(gearAttemptSwaps)
        .where(eq(gearAttemptSwaps.attemptId, attempt.id));
      return { rows, swaps, a: a.id, b: b.id, c: c.id };
    });
    expect(stored.rows).toEqual([
      { crank: 9, convergence: null, accused: null },
    ]);
    expect(stored.swaps).toHaveLength(1);
    expect([stored.swaps[0].a, stored.swaps[0].b].sort()).toEqual(
      [stored.a, stored.c].sort(),
    );
  });
});
