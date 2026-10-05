import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import { attempts, gearAttempts, puzzles } from "@/db/schema";
import { generateDiagram } from "./generate";
import { gearsModule } from "./module";

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ toString: () => "" }),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth")>();
  const api = Object.create(original.auth.api, {
    getSession: {
      value: async () =>
        session.userId ? { user: { id: session.userId } } : null,
    },
  });
  return { ...original, auth: { ...original.auth, api } };
});

const { checkAnswer, saveState } = await import("@/lib/actions/puzzles");

const content = generateDiagram("2026-11-03", "hard");
const { crank, convergence, killerLabel } = content.solution;
const full = { mode: "full" as const, durationMs: 1000 };
let puzzleId: string;
let otherPuzzleId: string;
let userId: string;

async function makePuzzle(slug: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({
        typeKey: "gears",
        slug,
        title: slug,
        difficulty: 1,
        publishedAt: new Date(Date.now() - 1000),
      })
      .returning({ id: puzzles.id });
    await gearsModule.upsertContent(tx, row.id, content);
    return row.id;
  });
}

async function gearId(id: string, label: string) {
  const found = await db.query.gearPuzzleGears.findFirst({
    where: { puzzleId: id, label },
    columns: { id: true },
  });
  if (!found) throw new Error(`no gear ${label}`);
  return found.id;
}

const removePuzzles = () =>
  db.delete(puzzles).where(sql`${puzzles.slug} like 't040-%'`);
const count = async (table: typeof attempts | typeof gearAttempts) =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(table))[0].n;

beforeAll(async () => {
  await db.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('gear-t040', 'gs', 99) on conflict (key) do nothing`,
  );
  await db.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('gears', 'gear-t040', 'gears', 'gears', 'gear_puzzles', 1)
    on conflict (key) do nothing`);
  await removePuzzles();
  puzzleId = await makePuzzle("t040-a");
  otherPuzzleId = await makePuzzle("t040-b");
  userId = await createTestUser("t040");
});

afterAll(async () => {
  await removePuzzles();
  await deleteTestUsers();
});

beforeEach(async () => {
  session.userId = userId;
  await db.delete(attempts).where(eq(attempts.userId, userId));
});

describe("checkAnswer for gears", () => {
  it("solves on the stored solution and keeps the accused gear", async () => {
    const accusedGearId = await gearId(puzzleId, killerLabel);
    const answer = { crank, convergence, accusedGearId, swaps: [] };
    expect(await saveState(puzzleId, answer)).toEqual({ ok: true });
    expect(await checkAnswer(puzzleId, answer, full)).toEqual({
      ok: true,
      result: { correct: true },
    });
    const [row] = await db
      .select({ completedAt: attempts.completedAt })
      .from(attempts)
      .where(eq(attempts.userId, userId));
    expect(row.completedAt).not.toBeNull();
    const saved = await db.query.gearAttempts.findFirst({
      columns: { accusedGearId: true },
    });
    expect(saved?.accusedGearId).toBe(accusedGearId);
  });

  it("AC3: a wrong accusation returns only { correct: false }", async () => {
    const wrong = content.gears.find((g) => g.label !== killerLabel);
    const accusedGearId = await gearId(puzzleId, wrong?.label ?? "");
    const out = await checkAnswer(
      puzzleId,
      { crank, convergence, accusedGearId, swaps: [] },
      full,
    );
    expect(out).toEqual({ ok: true, result: { correct: false } });
  });

  it("AC5: rejects convergence 9 and a gear of another puzzle, recording nothing", async () => {
    const own = await gearId(puzzleId, killerLabel);
    const foreign = await gearId(otherPuzzleId, killerLabel);
    const base = { crank: 0, convergence: 5, swaps: [] };
    const attemptsBefore = await count(attempts);
    const gearAttemptsBefore = await count(gearAttempts);
    expect(
      await checkAnswer(
        puzzleId,
        { ...base, convergence: 9, accusedGearId: own },
        full,
      ),
    ).toEqual({ ok: false, error: "invalid" });
    await expect(
      checkAnswer(puzzleId, { ...base, accusedGearId: foreign }, full),
    ).rejects.toThrow(/does not belong/);
    expect(await count(attempts)).toBe(attemptsBefore);
    expect(await count(gearAttempts)).toBe(gearAttemptsBefore);
  });
});
