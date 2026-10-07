import { describe, expect, it } from "vitest";
import { classic, classicSolution, itemId, payloadOf, variant } from "./fixture";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("logic grid schemas", () => {
  it("parses a payload and rejects solution links and a false flag", () => {
    const payload = payloadOf(variant);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(
      payloadSchema
        .strict()
        .safeParse({ ...payload, links: classicSolution.links }).success,
    ).toBe(false);
    expect(
      payloadSchema.strict().safeParse({
        ...payload,
        clues: [{ ...payload.clues[0], isFalse: false }],
      }).success,
    ).toBe(false);
  });

  it("shows a variant payload only that a clue is false, never which", () => {
    const payload = payloadOf(variant);
    expect(payload.variant).toBe(true);
    expect(JSON.stringify(payload)).not.toMatch(/isFalse|is_false|links/);
  });

  it("parses every fixture as content, and rejects a rule it does not know", () => {
    expect(contentSchema.safeParse(classic).success).toBe(true);
    expect(contentSchema.safeParse(variant).success).toBe(true);
    expect(
      contentSchema.safeParse({
        ...classic,
        clues: [{ content: "x", rule: { kind: "before", a: "Ann", b: "Bob" } }],
      }).success,
    ).toBe(false);
  });

  it("needs three to six categories of three to six items", () => {
    expect(
      contentSchema.safeParse({
        ...classic,
        categories: classic.categories.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...classic,
        categories: classic.categories.map((c) => ({ ...c, items: c.items.slice(0, 2) })),
      }).success,
    ).toBe(false);
  });

  it("parses an answer with or without a flagged clue", () => {
    const links = classicSolution.links;
    expect(answerSchema.safeParse({ links }).success).toBe(true);
    expect(answerSchema.safeParse({ links, falseCluePosition: 3 }).success).toBe(true);
    expect(answerSchema.safeParse({ links, falseCluePosition: null }).success).toBe(true);
    expect(answerSchema.safeParse({ links: [{ itemAId: "x", itemBId: "y" }] }).success).toBe(false);
  });

  it("parses an attempt of marks, struck clues and a flagged clue", () => {
    const state = {
      marks: [
        { itemAId: itemId(0, 0), itemBId: itemId(1, 0), mark: "yes" as const },
        { itemAId: itemId(0, 0), itemBId: itemId(1, 1), mark: "no" as const },
      ],
      struckClues: [{ cluePosition: 1 }],
      falseCluePosition: null,
    };
    expect(attemptSchema.parse(state)).toEqual(state);
    expect(
      attemptSchema.safeParse({
        ...state,
        marks: [{ ...state.marks[0], mark: "maybe" }],
      }).success,
    ).toBe(false);
  });
});
