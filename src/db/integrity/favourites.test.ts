import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user, userFavouriteTypes, userTypeVisits } from "@/db/schema";
import { createTestUser, deleteTestUsers, pgErrorCode } from "./harness";

afterAll(deleteTestUsers);

describe.each([
  ["user_favourite_types", userFavouriteTypes],
  ["user_type_visits", userTypeVisits],
])("%s", (_, table) => {
  it("rejects a duplicate (user_id, type_key) and an unknown type_key", async () => {
    const userId = await createTestUser("fav");
    expect(
      await pgErrorCode(async (tx) => {
        await tx.insert(table).values({ userId, typeKey: "troix" });
        await tx.insert(table).values({ userId, typeKey: "troix" });
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode((tx) =>
        tx.insert(table).values({ userId, typeKey: "not-a-type" }),
      ),
    ).toBe("23503");
    expect(
      await pgErrorCode((tx) =>
        tx.insert(table).values({ userId, typeKey: "troix" }),
      ),
    ).toBeUndefined();
  });

  it("is removed with the user", async () => {
    const userId = await createTestUser("fav-cascade");
    await db.insert(table).values({ userId, typeKey: "troix" });
    await db.delete(user).where(eq(user.id, userId));
    expect(
      await db.select().from(table).where(eq(table.userId, userId)),
    ).toEqual([]);
  });
});
