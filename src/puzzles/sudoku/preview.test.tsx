import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { content as cageMatch } from "../../../content/sudoku/cage-match";
import { content as romanNumerals } from "../../../content/sudoku/roman-numerals";
import { content as safeHouse } from "../../../content/sudoku/safe-house";
import { content as testCard } from "../../../content/sudoku/test-card";
import { content as tornEdges } from "../../../content/sudoku/torn-edges";
import { GROUP_FILLS } from "./regions";
import { Preview } from "./preview";
import { payloadSchema } from "./schema";

const render = (content: unknown) =>
  renderToStaticMarkup(
    createElement(Preview, { payload: payloadSchema.parse(content) }),
  );

const countElements = (markup: string) => markup.match(/<[a-z]/g)?.length ?? 0;

describe("sudoku preview of a region variant", () => {
  it("draws jigsaw region borders in place of the box lines", () => {
    const markup = render(tornEdges);
    expect(countElements(markup)).toBeLessThan(300);
    expect(markup).not.toContain("filter");
    expect(markup).toContain('class="fill-none stroke-ink"');
    expect(markup).not.toMatch(/rainbow/);
  });

  it("tints the nine rainbow colour groups", () => {
    const markup = render(testCard);
    expect(countElements(markup)).toBeLessThan(300);
    expect(markup).not.toContain("filter");
    for (const fill of GROUP_FILLS) expect(markup).toContain(`class="${fill}"`);
  });
});

describe("sudoku preview of a killer or XV puzzle", () => {
  it("draws dashed cage outlines with every sum", () => {
    for (const content of [cageMatch, safeHouse]) {
      const markup = render(content);
      expect(countElements(markup)).toBeLessThan(300);
      expect(markup).not.toContain("filter");
      expect(markup).toContain("stroke-dasharray");
      for (const { sum } of content.cages) {
        expect(markup).toContain(`>${sum}</text>`);
      }
    }
  });

  it("draws the X and V marks", () => {
    const markup = render(romanNumerals);
    expect(countElements(markup)).toBeLessThan(300);
    expect(markup).not.toContain("filter");
    const { marks } = romanNumerals.xv;
    expect(markup.match(/>X<\/text>/g)).toHaveLength(
      marks.filter(({ mark }) => mark === "x").length,
    );
    expect(markup.match(/>V<\/text>/g)).toHaveLength(
      marks.filter(({ mark }) => mark === "v").length,
    );
  });
});
