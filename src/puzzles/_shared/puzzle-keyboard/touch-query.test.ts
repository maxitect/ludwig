import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOUCH_QUERY } from "./keyboard-store";

const css = readFileSync("src/app/globals.css", "utf8");

describe("touch query", () => {
  it("is the media query of the CSS touch variant", () => {
    const variant = css.match(
      /@custom-variant touch \{\s*@media (.+) \{/,
    )?.[1];
    expect(variant).toBe(TOUCH_QUERY);
  });

  it("is the base of the touch-short variant", () => {
    expect(css).toContain(`@media ${TOUCH_QUERY} and (max-height: 44.999rem)`);
  });
});
