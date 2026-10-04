import { describe, expect, it, vi } from "vitest";
import { settingsSchema } from "@/lib/forms/settings";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth")>();
  const api = Object.create(original.auth.api, {
    getSession: { value: async () => null },
  });
  return { ...original, auth: { ...original.auth, api } };
});

const { updateUserSettings } = await import("./user");

const valid = {
  name: "John Taylor",
  theme: "ink",
  chessNotation: "descriptive",
  reduceMotion: true,
} as const;

describe("updateUserSettings", () => {
  it("throws without a session", async () => {
    await expect(updateUserSettings(valid)).rejects.toThrow("Unauthorised");
  });
});

describe("settingsSchema", () => {
  it("accepts every field", () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = settingsSchema.safeParse({ ...valid, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown theme and a missing field", () => {
    expect(settingsSchema.safeParse({ ...valid, theme: "red" }).success).toBe(
      false,
    );
    expect(
      settingsSchema.safeParse({ ...valid, reduceMotion: undefined }).success,
    ).toBe(false);
  });

  it("does not accept a userId", () => {
    expect(settingsSchema.shape).not.toHaveProperty("userId");
  });
});
