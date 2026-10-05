import { describe, expect, it } from "vitest";
import { verifyFullSsl } from "./verify-full-ssl";

describe("verifyFullSsl", () => {
  it.each(["require", "prefer", "verify-ca"])("rewrites sslmode=%s", (mode) => {
    expect(verifyFullSsl(`postgres://u:p@h/db?sslmode=${mode}`)).toBe(
      "postgres://u:p@h/db?sslmode=verify-full",
    );
  });

  it("keeps other params", () => {
    expect(
      verifyFullSsl(
        "postgres://u:p@h/db?channel_binding=require&sslmode=require&x=1",
      ),
    ).toBe("postgres://u:p@h/db?channel_binding=require&sslmode=verify-full&x=1");
  });

  it.each([
    "postgres://ludwig:ludwig@localhost:5432/ludwig",
    "postgres://u:p@h/db?sslmode=verify-full",
    "postgres://u:p@h/db?sslmode=disable",
  ])("leaves %s unchanged", (url) => {
    expect(verifyFullSsl(url)).toBe(url);
  });
});
