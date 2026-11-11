import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { createTestUser, deleteTestUsers } from "./harness";

afterAll(deleteTestUsers);

describe("user_settings email notifications", () => {
  it("are off by default with nothing recorded as sent", async () => {
    const userId = await createTestUser("notify-default");
    await db.insert(userSettings).values({ userId });
    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    expect(row).toMatchObject({
      notifyFavourites: false,
      notifyStreak: false,
      favouritesDigestAt: null,
      nudgeSentAt: null,
    });
  });
});
