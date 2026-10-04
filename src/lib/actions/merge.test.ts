import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { MAX_MERGE_ENTRIES } from "@/lib/forms/local-progress";
import { fixtureModule } from "@/puzzles/__fixture/module";
import { registry as fixtureRegistry } from "@/puzzles/__fixture/registry";

vi.mock("@/puzzles/registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/puzzles/registry")>();
  return {
    ...original,
    registry: fixtureRegistry,
    getPuzzleModule: (key: string) =>
      original.getPuzzleModule(key, fixtureRegistry),
  };
});

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

const { mergeLocalProgress } = await import("@/lib/actions/merge");
const { getAttemptState, getOrCreateAttempt } = await import(
  "@/lib/data/attempts"
);
const { replaceAttemptState } = await import("@/lib/data/attempts");

let puzzleId: string;
let userId: string;

const stateOf = (value: string) => ({ rows: [{ position: 0, value }] });
const entry = (overrides: Record<string, unknown> = {}) => ({
  puzzleId,
  typeKey: "__fixture",
  state: stateOf("local"),
  startedAt: Date.now() - 60_000,
  ...overrides,
});
const attemptRow = async () =>
  (await db.select().from(attempts).where(eq(attempts.userId, userId)))[0];
const count = async () =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(attempts))[0].n;

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
  await db.delete(puzzles).where(sql`${puzzles.slug} like 't020-%'`);
  puzzleId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({
        typeKey: "__fixture",
        slug: "t020-merge",
        title: "t020",
        difficulty: 1,
        publishedAt: new Date(Date.now() - 1000),
      })
      .returning({ id: puzzles.id });
    await fixtureModule.upsertContent(tx, row.id, {
      note: "alpha",
      items: [{ position: 0, label: "alpha" }],
    });
    return row.id;
  });
  userId = await createTestUser("t020");
});

afterAll(async () => {
  await db.delete(puzzles).where(sql`${puzzles.slug} like 't020-%'`);
  await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "__fixture"));
  await db
    .delete(puzzleCategories)
    .where(eq(puzzleCategories.key, "__fixture"));
  await deleteTestUsers();
});

beforeEach(async () => {
  session.userId = userId;
  await db.delete(attempts).where(eq(attempts.userId, userId));
});

describe("mergeLocalProgress", () => {
  it("creates the attempt and writes the local state when the server has none", async () => {
    expect(await mergeLocalProgress([entry()])).toEqual({ ok: true });
    expect(await getAttemptState(userId, puzzleId)).toEqual(stateOf("local"));
    expect((await attemptRow()).completedAt).toBeNull();
  });

  it("keeps the server state when both sides have one", async () => {
    const { id } = await getOrCreateAttempt(userId, puzzleId);
    await replaceAttemptState(id, stateOf("server"));
    expect(await mergeLocalProgress([entry()])).toEqual({ ok: true });
    expect(await getAttemptState(userId, puzzleId)).toEqual(stateOf("server"));
  });

  it("carries completion and duration over when the server attempt is not complete", async () => {
    const startedAt = Date.now() - 120_000;
    const completedAt = Date.now() - 60_000;
    await mergeLocalProgress([
      entry({ startedAt, completedAt, durationMs: 60_000 }),
    ]);
    const row = await attemptRow();
    expect(row.completedAt?.getTime()).toBe(completedAt);
    expect(row.startedAt.getTime()).toBe(startedAt);
    expect(row.durationMs).toBe(60_000);
  });

  it("clamps the duration to the local start-to-completion window", async () => {
    const startedAt = Date.now() - 120_000;
    const completedAt = Date.now() - 60_000;
    await mergeLocalProgress([
      entry({ startedAt, completedAt, durationMs: 10 * 60 * 60_000 }),
    ]);
    expect((await attemptRow()).durationMs).toBe(60_000);
  });

  it("rejects a duration beyond the integer column", async () => {
    expect(
      await mergeLocalProgress([
        entry({ startedAt: 0, completedAt: Date.now(), durationMs: 2 ** 31 }),
      ]),
    ).toEqual({ ok: false, error: "invalid" });
    expect(await count()).toBe(0);
  });

  it("does not overwrite a server completion", async () => {
    const { id } = await getOrCreateAttempt(userId, puzzleId);
    const serverCompletedAt = new Date(Date.now() - 5_000);
    await db
      .update(attempts)
      .set({ completedAt: serverCompletedAt, durationMs: 5_000 })
      .where(eq(attempts.id, id));
    await mergeLocalProgress([
      entry({ completedAt: Date.now() - 1_000, durationMs: 1_000 }),
    ]);
    const row = await attemptRow();
    expect(row.completedAt).toEqual(serverCompletedAt);
    expect(row.durationMs).toBe(5_000);
  });

  it("skips an entry whose state fails the attempt schema or whose type differs", async () => {
    expect(
      await mergeLocalProgress([
        entry({ state: { rows: [{ position: "x" }] } }),
        entry({ typeKey: "anagram" }),
      ]),
    ).toEqual({ ok: true });
    expect(await count()).toBe(0);
  });

  it("scopes every write to the signed-in user", async () => {
    const otherId = await createTestUser("t020-other");
    await mergeLocalProgress([entry()]);
    expect(await getAttemptState(otherId, puzzleId)).toBeNull();
  });

  it("rejects more than the cap with no database writes", async () => {
    const entries = Array.from({ length: MAX_MERGE_ENTRIES + 1 }, () => entry());
    expect(await mergeLocalProgress(entries)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await count()).toBe(0);
  });

  it("rejects malformed entries and signed-out calls", async () => {
    expect(await mergeLocalProgress([entry({ puzzleId: "nope" })])).toEqual({
      ok: false,
      error: "invalid",
    });
    session.userId = null;
    await expect(mergeLocalProgress([entry()])).rejects.toThrow("Unauthorised");
  });
});
