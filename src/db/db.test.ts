import { eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

const email = `t003-${Date.now()}@test.local`;

describe("db client", () => {
  afterAll(async () => {
    await db.delete(user).where(eq(user.email, email));
  });

  it("parses a user row with the generated select schema", async () => {
    const { user: created } = await auth.api.signUpEmail({
      body: { email, password: "correct-horse-battery", name: "Tester" },
    });
    const row = await db.query.user.findFirst({ where: { id: created.id } });
    expect(createSelectSchema(user).parse(row).email).toBe(email);
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, created.id));
    await auth.api.signInEmail({
      body: { email, password: "correct-horse-battery" },
    });
  });

  it("loads sessions through RQBv2 relations", async () => {
    const found = await db.query.user.findFirst({
      where: { email },
      with: { sessions: true },
    });
    expect(found?.sessions.length).toBeGreaterThanOrEqual(1);
  });
});
