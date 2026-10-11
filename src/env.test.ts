import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

const validEnv = {
  DATABASE_URL: "postgres://ludwig:ludwig@localhost:5432/ludwig",
  DATABASE_URL_UNPOOLED: "postgres://ludwig:ludwig@localhost:5432/ludwig",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    expect(parseEnv(validEnv)).toMatchObject(validEnv);
  });

  it("accepts optional Vercel variables", () => {
    const parsed = parseEnv({
      ...validEnv,
      VERCEL_ENV: "preview",
      VERCEL_URL: "ludwig.vercel.app",
    });
    expect(parsed.VERCEL_ENV).toBe("preview");
  });

  it("allows a missing BETTER_AUTH_URL on Vercel previews", () => {
    const parsed = parseEnv({
      ...validEnv,
      BETTER_AUTH_URL: undefined,
      VERCEL_ENV: "preview",
    });
    expect(parsed.BETTER_AUTH_URL).toBeUndefined();
  });

  it("requires BETTER_AUTH_URL outside previews", () => {
    expect(() =>
      parseEnv({ ...validEnv, BETTER_AUTH_URL: undefined }),
    ).toThrow(/BETTER_AUTH_URL/);
    expect(() =>
      parseEnv({
        ...validEnv,
        BETTER_AUTH_URL: undefined,
        VERCEL_ENV: "production",
      }),
    ).toThrow(/BETTER_AUTH_URL/);
  });

  it("rejects a missing DATABASE_URL and names it", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL:/,
    );
  });

  it("rejects a short BETTER_AUTH_SECRET and names it", () => {
    expect(() =>
      parseEnv({ ...validEnv, BETTER_AUTH_SECRET: "a".repeat(10) }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("rejects a non-URL BETTER_AUTH_URL and names it", () => {
    expect(() =>
      parseEnv({ ...validEnv, BETTER_AUTH_URL: "not a url" }),
    ).toThrow(/BETTER_AUTH_URL/);
  });

  it("treats an empty RESEND_API_KEY as unset and defaults EMAIL_FROM", () => {
    const parsed = parseEnv({ ...validEnv, RESEND_API_KEY: "" });
    expect(parsed.RESEND_API_KEY).toBeUndefined();
    expect(parsed.EMAIL_FROM).toBe("Ludwig <auth@noreply.ludwigpuzzles.com>");
  });

  it("lists every invalid key at once", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        BETTER_AUTH_SECRET: "short",
        BETTER_AUTH_URL: "x",
      }),
    ).toThrow(/BETTER_AUTH_SECRET[\s\S]*BETTER_AUTH_URL/);
  });
});
