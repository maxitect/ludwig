import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class Rollback extends Error {}

/** Runs `fn` in a transaction that is always rolled back, returning the Postgres error it raised, if any. */
export async function pgError(fn: (tx: Tx) => Promise<unknown>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (error instanceof Rollback) return undefined;
    return (error as { cause?: { code?: string; message?: string } }).cause;
  }
}

export async function pgErrorCode(fn: (tx: Tx) => Promise<unknown>) {
  return (await pgError(fn))?.code;
}

/** Runs `fn` in a transaction that is always rolled back, returning its result. */
export async function rolledBack<T>(fn: (tx: Tx) => Promise<T>) {
  let result!: T;
  try {
    await db.transaction(async (tx) => {
      result = await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  return result;
}

/** Fires deferred constraint triggers that a rolled-back transaction would never reach at COMMIT. */
export function forceDeferred(tx: Tx) {
  return tx.execute(sql`set constraints all immediate`);
}

/** Creates a puzzle category, two puzzle types (`fx`, `other`) and the subtype table `zz_fixture_puzzles` for `fx`. */
export async function createFixtureSubtype(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('zz', 'zz', 1)`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('fx', 'zz', 'fx', 'fx', 'zz_fixture_puzzles', 1),
           ('other', 'zz', 'other', 'other', 'zz_other_puzzles', 2)
  `);
  await tx.execute(sql`
    create table zz_fixture_puzzles (
      puzzle_id uuid primary key,
      type_key text generated always as ('fx') stored,
      foreign key (puzzle_id, type_key) references puzzles (id, type_key) on delete cascade
    )
  `);
}

const createdUserIds: string[] = [];

/** Creates a user through the Better Auth API. Call `deleteTestUsers` in `afterAll`. */
export async function createTestUser(prefix: string) {
  const { user: created } = await auth.api.signUpEmail({
    body: {
      email: `${prefix}-${Date.now()}-${createdUserIds.length}@test.local`,
      password: "correct-horse-battery",
      name: "Tester",
    },
  });
  createdUserIds.push(created.id);
  return created.id;
}

export async function deleteTestUsers() {
  if (!createdUserIds.length) return;
  await db.delete(user).where(inArray(user.id, createdUserIds));
  createdUserIds.length = 0;
}
