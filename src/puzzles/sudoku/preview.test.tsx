import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
