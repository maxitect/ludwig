import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)a?\(/;

describe("spot-difference sources", () => {
  it("hold no hex or colour function literals", () => {
    const sources = readdirSync(__dirname).filter(
      (file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"),
    );
    expect(sources.length).toBeGreaterThan(0);
    const offenders = sources.filter((file) =>
      COLOUR_LITERAL.test(readFileSync(join(__dirname, file), "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
