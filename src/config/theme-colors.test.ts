import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { themeColors } from "./theme-colors";

describe("themeColors", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  it.each(Object.entries(themeColors))(
    "%s matches its CSS token",
    (name, hex) => {
      expect(css).toContain(`--color-${name}: ${hex};`);
    },
  );
});
