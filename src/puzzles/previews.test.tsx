import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { previews } from "./previews";
import { samplePayloads as payloads } from "./sample-payloads";
import { getPuzzleModule, registry, type PuzzleTypeKey } from "./registry";

const NODE_BUDGET = 300;

type PreviewRenderer = (props: { payload: unknown }) => ReactNode;

const countElements = (markup: string) => markup.match(/<[a-z]/g)?.length ?? 0;

describe("previews", () => {
  it("has a fixture and a preview for every registered type", () => {
    expect(Object.keys(previews).toSorted()).toEqual(
      Object.keys(registry).toSorted(),
    );
    expect(Object.keys(payloads).toSorted()).toEqual(
      Object.keys(registry).toSorted(),
    );
  });

  it.each(Object.keys(previews) as PuzzleTypeKey[])(
    "%s renders from its parsed payload alone",
    (key) => {
      const payload = getPuzzleModule(key).schema.payloadSchema.parse(
        payloads[key],
      );
      const markup = renderToStaticMarkup(
        createElement(previews[key] as PreviewRenderer, { payload }),
      );
      expect(markup).toContain("<svg");
      expect(countElements(markup)).toBeLessThan(NODE_BUDGET);
      expect(markup).not.toContain("filter");
      expect(markup).toMatchSnapshot();
    },
  );
});
