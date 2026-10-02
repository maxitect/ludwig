import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect-path";

describe("safeRedirectPath", () => {
  it.each(["/casebook", "/settings?tab=a", "/"])("keeps %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "casebook",
    "",
    null,
    undefined,
  ])("rejects %s", (path) => {
    expect(safeRedirectPath(path)).toBe("/");
  });
});
