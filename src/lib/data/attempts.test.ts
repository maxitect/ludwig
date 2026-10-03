import { eq, sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attemptHints,
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { fixtureModule } from "@/puzzles/__fixture/module";
import { registry as fixtureRegistry } from "@/puzzles/__fixture/registry";
import { fixtureAttemptRows } from "@/puzzles/__fixture/tables";

const dataAccessSpies = vi.hoisted(() => ({
  fns: [] as ReturnType<typeof vi.fn>[],
  wrap<T extends object>(module: T): T {
    return Object.fromEntries(
      Object.entries(module).map(([name, fn]) => {
        const spy = vi.fn(fn as (...args: never[]) => unknown);
        dataAccessSpies.fns.push(spy);
        return [name, spy];
      }),
    ) as T;
  },
}));

vi.mock("@/puzzles/registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/puzzles/registry")>();
  return {
    ...original,
    registry: fixtureRegistry,
    getPuzzleModule: (key: string) =>
      original.getPuzzleModule(key, fixtureRegistry),
  };
});
vi.mock("@/lib/data/attempts", async (importOriginal) =>
  dataAccessSpies.wrap(await importOriginal()),
);
vi.mock("@/lib/data/puzzles", async (importOriginal) =>
  dataAccessSpies.wrap(await importOriginal()),
);

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
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

const { completeAttempt, getAttemptState, getOrCreateAttempt } = await import(
  "@/lib/data/attempts"
);
const { getPublishedTypeKey, getPuzzleForPlay } = await import(
  "@/lib/data/puzzles"
);
const { checkAnswer, clearState, revealCell, saveState } = await import(
  "@/lib/actions/puzzles"
);

const slug = "t017-play";
let puzzleId: string;
let unpublishedId: string;
let userId: string;

function makePuzzle(name: string, publishedAt: Date | null) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({
        typeKey: "__fixture",
        slug: name,
        title: name,
        difficulty: 1,
        publishedAt,
      })
      .returning({ id: puzzles.id });
    await fixtureModule.upsertContent(tx, row.id, {
      note: "alpha",
      items: [{ position: 0, label: "alpha" }],
    });
    return row.id;
  });
}

const removePuzzles = () =>
  db.delete(puzzles).where(sql`${puzzles.slug} like 't017-%'`);

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: "__fixture", name: "Fixture", sort: 99 })
    .onConflictDoNothing();
  await db
    .insert(puzzleTypes)
    .values({
      key: "__fixture",
      categoryKey: "__fixture",
      name: "Fixture",
      description: "Test-only type",
      subtypeTable: "fixture_puzzles",
      sort: 99,
    })
    .onConflictDoNothing();
  await removePuzzles();
  puzzleId = await makePuzzle(slug, new Date(Date.now() - 1000));
  unpublishedId = await makePuzzle("t017-draft", null);
  userId = await createTestUser("t017");
});

afterAll(async () => {
  await removePuzzles();
  await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "__fixture"));
  await db
    .delete(puzzleCategories)
    .where(eq(puzzleCategories.key, "__fixture"));
  await deleteTestUsers();
});

beforeEach(async () => {
  session.userId = userId;
  await db.delete(attempts).where(eq(attempts.userId, userId));
  for (const spy of dataAccessSpies.fns) spy.mockClear();
});

const count = async (table: typeof attempts | typeof attemptHints) =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(table))[0].n;
const hintCounts = async (attemptId: string) =>
  Object.fromEntries(
    (
      await db
        .select({ kind: attemptHints.kind, n: sql<number>`count(*)::int` })
        .from(attemptHints)
        .where(eq(attemptHints.attemptId, attemptId))
        .groupBy(attemptHints.kind)
    ).map((row) => [row.kind, row.n]),
  );
const attemptRow = async () =>
  (await db.select().from(attempts).where(eq(attempts.userId, userId)))[0];

describe("getOrCreateAttempt", () => {
  it("creates exactly one attempt per user and puzzle and the trigger fills type_key", async () => {
    const a = await getOrCreateAttempt(userId, puzzleId);
    const b = await getOrCreateAttempt(userId, puzzleId);
    expect(b.id).toBe(a.id);
    const rows = await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0].typeKey).toBe("__fixture");
  });
});

describe("saveState", () => {
  it("replaces the attempt-state rows instead of appending", async () => {
    const stateA = {
      rows: [0, 1, 2].map((position) => ({ position, value: `a${position}` })),
    };
    const stateB = { rows: [{ position: 0, value: "b0" }] };
    expect(await saveState(puzzleId, stateA)).toEqual({ ok: true });
    expect(await saveState(puzzleId, stateB)).toEqual({ ok: true });
    const { id } = await attemptRow();
    const rows = await db
      .select({
        position: fixtureAttemptRows.position,
        value: fixtureAttemptRows.value,
      })
      .from(fixtureAttemptRows)
      .where(eq(fixtureAttemptRows.attemptId, id));
    expect(rows).toEqual(stateB.rows);
  });
});

describe("getAttemptState", () => {
  const state = { rows: [{ position: 0, value: "saved" }] };

  it("is null before anything is saved and returns the saved state after", async () => {
    expect(await getAttemptState(userId, puzzleId)).toBeNull();
    await saveState(puzzleId, state);
    expect(await getAttemptState(userId, puzzleId)).toEqual(state);
  });

  it("never returns another user's state", async () => {
    await saveState(puzzleId, state);
    const otherId = await createTestUser("t019");
    expect(await getAttemptState(otherId, puzzleId)).toBeNull();
  });

  it("is null again after clearState", async () => {
    await saveState(puzzleId, state);
    expect(await clearState(puzzleId)).toEqual({ ok: true });
    expect(await getAttemptState(userId, puzzleId)).toBeNull();
  });
});

describe("hints", () => {
  it("inserts check_cell and reveal_cell rows without completing", async () => {
    const cell = { mode: "cell" as const, row: 0, col: 1 };
    expect(await checkAnswer(puzzleId, null, { ...cell, value: "alpha" })).toEqual({
      ok: true,
      result: { correct: true },
    });
    expect(await checkAnswer(puzzleId, null, { ...cell, value: "wrong" })).toEqual({
      ok: true,
      result: { correct: false },
    });
    expect(await revealCell(puzzleId, 2, 3)).toEqual({
      ok: true,
      value: "alpha",
    });
    const { id, completedAt } = await attemptRow();
    expect(await hintCounts(id)).toEqual({ check_cell: 2, reveal_cell: 1 });
    expect(completedAt).toBeNull();
  });
});

describe("completion", () => {
  const full = (durationMs: number) => ({
    mode: "full" as const,
    durationMs,
  });

  it("completes once and never overwrites completed_at", async () => {
    expect(await checkAnswer(puzzleId, { label: "alpha" }, full(0))).toEqual({
      ok: true,
      result: { correct: true },
    });
    const first = await attemptRow();
    expect(first.completedAt).not.toBeNull();
    await checkAnswer(puzzleId, { label: "alpha" }, full(0));
    const second = await attemptRow();
    expect(second.completedAt).toEqual(first.completedAt);
    expect(second.durationMs).toBe(first.durationMs);
  });

  it("does not complete on a wrong answer", async () => {
    const out = await checkAnswer(puzzleId, { label: "nope" }, full(5));
    expect(out).toEqual({ ok: true, result: { correct: false } });
    expect((await attemptRow()).completedAt).toBeNull();
  });

  it("clamps the duration to now - started_at", async () => {
    const { id } = await getOrCreateAttempt(userId, puzzleId);
    await completeAttempt(id, 10_000_000_000);
    const [row] = await db
      .select({
        durationMs: attempts.durationMs,
        elapsed: sql<string>`floor(extract(epoch from (now() - ${attempts.startedAt})) * 1000)::bigint`,
      })
      .from(attempts)
      .where(eq(attempts.id, id));
    expect(row.durationMs).toBeLessThanOrEqual(Number(row.elapsed));
    expect(row.durationMs).toBeLessThan(60_000);
  });

  it("clamps negative durations to 0", async () => {
    const { id } = await getOrCreateAttempt(userId, puzzleId);
    await completeAttempt(id, -5);
    expect((await attemptRow()).durationMs).toBe(0);
  });
});

describe("unauthenticated", () => {
  it("rejects every action and writes nothing", async () => {
    session.userId = null;
    const before = [await count(attempts), await count(attemptHints)];
    await expect(saveState(puzzleId, { rows: [] })).rejects.toThrow(
      "Unauthorised",
    );
    await expect(
      checkAnswer(puzzleId, { label: "alpha" }, { mode: "full", durationMs: 1 }),
    ).rejects.toThrow("Unauthorised");
    await expect(
      checkAnswer(
        puzzleId,
        { label: "alpha" },
        { mode: "cell", row: 0, col: 0, value: "alpha" },
      ),
    ).rejects.toThrow("Unauthorised");
    await expect(revealCell(puzzleId, 0, 0)).rejects.toThrow("Unauthorised");
    expect([await count(attempts), await count(attemptHints)]).toEqual(before);
  });
});

describe("validation", () => {
  it("makes no data-access call for a malformed puzzle id or options", async () => {
    const results = [
      await saveState("not-a-uuid", { rows: [] }),
      await checkAnswer("nope", { label: "a" }, { mode: "full", durationMs: 1 }),
      await checkAnswer(
        puzzleId,
        { label: "a" },
        { mode: "cell", row: -1, col: 0, value: "alpha" },
      ),
      await checkAnswer(
        puzzleId,
        { label: "a" },
        { mode: "full", durationMs: -1 },
      ),
      await revealCell(puzzleId, 1.5, 0),
    ];
    for (const result of results) {
      expect(result).toEqual({ ok: false, error: "invalid" });
    }
    for (const spy of dataAccessSpies.fns) expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a malformed answer or state before any attempt access", async () => {
    expect(await saveState(puzzleId, { rows: [{ position: "x" }] })).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(
      await checkAnswer(puzzleId, { label: 42 }, { mode: "full", durationMs: 1 }),
    ).toEqual({ ok: false, error: "invalid" });
    expect(getOrCreateAttempt).not.toHaveBeenCalled();
    expect(await count(attempts)).toBe(0);
    expect(await count(attemptHints)).toBe(0);
  });

  it("returns not_found for an unpublished puzzle and writes nothing", async () => {
    expect(await saveState(unpublishedId, { rows: [] })).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(await revealCell(unpublishedId, 0, 0)).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(await count(attempts)).toBe(0);
  });
});

describe("getPuzzleForPlay", () => {
  it("returns a payload with no solution fields", async () => {
    const result = await getPuzzleForPlay("__fixture", slug);
    expect(result).not.toBeNull();
    expect(() =>
      fixtureModule.schema.payloadSchema.strict().parse(result!.payload),
    ).not.toThrow();
    expect(JSON.stringify(result)).not.toContain("note");
  });

  it("returns null for an unpublished or unknown puzzle", async () => {
    expect(await getPuzzleForPlay("__fixture", "t017-draft")).toBeNull();
    expect(await getPuzzleForPlay("__fixture", "t017-missing")).toBeNull();
    expect(await getPublishedTypeKey(unpublishedId)).toBeNull();
  });
});
