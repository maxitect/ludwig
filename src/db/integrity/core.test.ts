import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { attempts, puzzles } from "@/db/schema";
import {
  createFixtureSubtype,
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  rolledBack,
  type Tx,
} from "./harness";

const puzzleBase = { typeKey: "fx", slug: "one", title: "One", difficulty: 3 };

async function insertPuzzle(tx: Tx, typeKey = "fx") {
  const [puzzle] = await tx
    .insert(puzzles)
    .values({ ...puzzleBase, typeKey })
    .returning({ id: puzzles.id });
  return puzzle.id;
}

function insertSubtype(tx: Tx, puzzleId: string) {
  return tx.execute(
    sql`insert into zz_fixture_puzzles (puzzle_id) values (${puzzleId})`,
  );
}

describe("puzzles_require_subtype", () => {
  it("accepts a puzzle with its subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await createFixtureSubtype(tx);
        await insertSubtype(tx, await insertPuzzle(tx));
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a puzzle without a subtype row", async () => {
    const error = await pgError(async (tx) => {
      await createFixtureSubtype(tx);
      await insertPuzzle(tx);
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in zz_fixture_puzzles/);
  });
});

describe("subtype type_key pinning", () => {
  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await createFixtureSubtype(tx);
        await insertSubtype(tx, await insertPuzzle(tx, "other"));
      }),
    ).toBe("23503");
  });

  it("rejects changing the type of a puzzle that has a subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        await createFixtureSubtype(tx);
        const id = await insertPuzzle(tx);
        await insertSubtype(tx, id);
        await tx.execute(
          sql`update puzzles set type_key = 'other' where id = ${id}`,
        );
      }),
    ).toBe("23503");
  });
});

describe("attempts_fill_type_key", () => {
  let userId: string;

  afterAll(deleteTestUsers);

  async function setup(tx: Tx) {
    userId ??= await createTestUser("t005");
    await createFixtureSubtype(tx);
    return insertPuzzle(tx);
  }

  it("fills type_key from the puzzle", async () => {
    const typeKey = await rolledBack(async (tx) => {
      const puzzleId = await setup(tx);
      const [row] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ typeKey: attempts.typeKey });
      return row.typeKey;
    });
    expect(typeKey).toBe("fx");
  });

  it("overwrites an explicitly wrong type_key", async () => {
    const typeKey = await rolledBack(async (tx) => {
      const puzzleId = await setup(tx);
      const [row] = await tx
        .insert(attempts)
        .values({ userId, puzzleId, typeKey: "other" })
        .returning({ typeKey: attempts.typeKey });
      return row.typeKey;
    });
    expect(typeKey).toBe("fx");
  });

  it("still rejects an attempt for a missing puzzle", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        userId ??= await createTestUser("t005");
        await tx.insert(attempts).values({
          userId,
          puzzleId: "00000000-0000-0000-0000-000000000000",
          typeKey: "fx",
        });
      }),
    ).toBe("23503");
  });
});
