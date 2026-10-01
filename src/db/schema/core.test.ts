import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-orm/zod";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  attemptHints,
  attempts,
  puzzleCategories,
  puzzleInsertSchema,
  puzzles,
  puzzleTypes,
  user,
  userSettings,
  volumes,
  weeklyPuzzles,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const insertSchemas = {
  puzzleCategories: createInsertSchema(puzzleCategories),
  puzzleTypes: createInsertSchema(puzzleTypes),
  userSettings: createInsertSchema(userSettings),
  volumes: createInsertSchema(volumes),
  puzzles: puzzleInsertSchema,
  weeklyPuzzles: createInsertSchema(weeklyPuzzles),
  attempts: createInsertSchema(attempts),
  attemptHints: createInsertSchema(attemptHints),
};

const puzzleBase = {
  typeKey: "a",
  slug: "one",
  title: "One",
  difficulty: 3,
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class Rollback extends Error {}

/** Runs `fn` in a transaction that is always rolled back, returning the Postgres error code it raised, if any. */
async function pgErrorCode(fn: (tx: Tx) => Promise<unknown>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (error instanceof Rollback) return undefined;
    return (error as { cause?: { code?: string } }).cause?.code;
  }
}

async function seedTypes(tx: Tx) {
  await tx
    .insert(puzzleCategories)
    .values({ key: "cat", name: "Cat", sort: 1 });
  await tx.insert(puzzleTypes).values(
    ["a", "b"].map((key, sort) => ({
      key,
      categoryKey: "cat",
      name: key,
      description: key,
      subtypeTable: `${key}_puzzles`,
      sort,
    })),
  );
}

describe("insert schemas", () => {
  it.each(Object.entries(insertSchemas))("derives for %s", (_, schema) => {
    expect(schema.shape).toBeDefined();
  });

  it("rejects difficulty 6 on puzzles", () => {
    const result = insertSchemas.puzzles.safeParse({
      ...puzzleBase,
      difficulty: 6,
    });
    expect(result.success).toBe(false);
  });
});

describe("constraints", () => {
  it("constrains difficulty to 1-5", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await seedTypes(tx);
        await tx.insert(puzzles).values({ ...puzzleBase, difficulty: 6 });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        await seedTypes(tx);
        await tx.insert(puzzles).values(puzzleBase);
      }),
    ).toBeUndefined();
  });

  it("scopes slugs per type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await seedTypes(tx);
        await tx.insert(puzzles).values(puzzleBase);
        await tx.insert(puzzles).values({ ...puzzleBase, typeKey: "b" });
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        await seedTypes(tx);
        await tx.insert(puzzles).values(puzzleBase);
        await tx.insert(puzzles).values(puzzleBase);
      }),
    ).toBe("23505");
  });

  it("allows one puzzle per weekly slot and one slot per puzzle", async () => {
    const week = "2026-01-05";
    const setup = async (tx: Tx) => {
      await seedTypes(tx);
      const [p1, p2] = await tx
        .insert(puzzles)
        .values([puzzleBase, { ...puzzleBase, slug: "two" }])
        .returning({ id: puzzles.id });
      return [p1.id, p2.id] as const;
    };
    expect(
      await pgErrorCode(async (tx) => {
        const [p1, p2] = await setup(tx);
        await tx.insert(weeklyPuzzles).values([
          { weekStart: week, slot: "first", puzzleId: p1 },
          { weekStart: week, slot: "second", puzzleId: p2 },
        ]);
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const [p1, p2] = await setup(tx);
        await tx.insert(weeklyPuzzles).values([
          { weekStart: week, slot: "first", puzzleId: p1 },
          { weekStart: week, slot: "first", puzzleId: p2 },
        ]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const [p1] = await setup(tx);
        await tx.insert(weeklyPuzzles).values([
          { weekStart: week, slot: "first", puzzleId: p1 },
          { weekStart: week, slot: "second", puzzleId: p1 },
        ]);
      }),
    ).toBe("23505");
  });
});

describe("attempts", () => {
  const email = `t004-${Date.now()}@test.local`;
  let userId: string;

  afterAll(async () => {
    await db.delete(user).where(eq(user.email, email));
  });

  async function setup(tx: Tx) {
    if (!userId) {
      const { user: created } = await auth.api.signUpEmail({
        body: { email, password: "correct-horse-battery", name: "Tester" },
      });
      userId = created.id;
    }
    await seedTypes(tx);
    const [puzzle] = await tx
      .insert(puzzles)
      .values(puzzleBase)
      .returning({ id: puzzles.id });
    return puzzle.id;
  }

  it("pins type_key to the puzzle through the composite FK", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await setup(tx);
        await tx.insert(attempts).values({ userId, puzzleId, typeKey: "b" });
      }),
    ).toBe("23503");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await setup(tx);
        await tx.insert(attempts).values({ userId, puzzleId, typeKey: "a" });
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await setup(tx);
        await tx.insert(attempts).values({ userId, puzzleId });
      }),
    ).toBe("23502");
  });

  it("cascades user deletion to settings and attempts", async () => {
    const cascadeEmail = `t004-cascade-${Date.now()}@test.local`;
    const { user: created } = await auth.api.signUpEmail({
      body: {
        email: cascadeEmail,
        password: "correct-horse-battery",
        name: "Cascade",
      },
    });
    await db.insert(userSettings).values({ userId: created.id });
    await db.insert(puzzleCategories).values({ key: "cx", name: "c", sort: 1 });
    await db.insert(puzzleTypes).values({
      key: "cxa",
      categoryKey: "cx",
      name: "a",
      description: "a",
      subtypeTable: "cxa_puzzles",
      sort: 1,
    });
    const [puzzle] = await db
      .insert(puzzles)
      .values({ ...puzzleBase, typeKey: "cxa" })
      .returning({ id: puzzles.id });
    try {
      await db
        .insert(attempts)
        .values({ userId: created.id, puzzleId: puzzle.id, typeKey: "cxa" });
      await db.delete(user).where(eq(user.id, created.id));
      expect(
        await db.query.userSettings.findMany({ where: { userId: created.id } }),
      ).toHaveLength(0);
      expect(
        await db.query.attempts.findMany({ where: { userId: created.id } }),
      ).toHaveLength(0);
    } finally {
      await db.delete(puzzles).where(eq(puzzles.id, puzzle.id));
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "cxa"));
      await db.delete(puzzleCategories).where(eq(puzzleCategories.key, "cx"));
    }
  });
});
