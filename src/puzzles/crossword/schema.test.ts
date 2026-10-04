import { describe, expect, it } from "vitest";
import { clues, fixture, toPayloadClues } from "./fixture";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

const payload = {
  style: "quick",
  rows: 5,
  cols: 5,
  cells: fixture.cells.map(({ row, col }) => ({ row, col })),
  clues: toPayloadClues(clues),
};

describe("payloadSchema", () => {
  it("parses a payload of positions and clues", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it("rejects a cell that carries a letter", () => {
    const leaked = {
      ...payload,
      cells: [{ ...payload.cells[0], letter: "C" }, ...payload.cells.slice(1)],
    };
    expect(payloadSchema.strict().safeParse(leaked).success).toBe(false);
  });

  it("rejects a top-level answer field", () => {
    expect(
      payloadSchema.strict().safeParse({ ...payload, answer: "CRANE" }).success,
    ).toBe(false);
  });

  it("rejects a clue that carries its answer", () => {
    const leaked = {
      ...payload,
      clues: [{ ...payload.clues[0], answer: "CRANE" }, ...payload.clues.slice(1)],
    };
    expect(payloadSchema.safeParse(leaked).success).toBe(false);
  });
});

describe("contentSchema", () => {
  it("accepts the fixture", () => {
    expect(contentSchema.safeParse(fixture).success).toBe(true);
  });

  it.each(["a", "AB", "1", ""])("rejects the cell letter %j", (letter) => {
    const bad = {
      ...fixture,
      cells: [{ ...fixture.cells[0], letter }, ...fixture.cells.slice(1)],
    };
    expect(contentSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects separators that do not number one fewer than segments", () => {
    const bad = {
      ...fixture,
      clues: [
        { ...clues[0], segments: [2, 3], separators: ["word", "hyphen"] },
        ...clues.slice(1),
      ],
    };
    expect(contentSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a clue with no segments", () => {
    const bad = {
      ...fixture,
      clues: [{ ...clues[0], segments: [] }, ...clues.slice(1)],
    };
    expect(contentSchema.safeParse(bad).success).toBe(false);
  });
});

describe("answerSchema and attemptSchema", () => {
  const filled = { cells: [{ row: 0, col: 0, letter: "C" }] };

  it("accept a partly filled grid", () => {
    expect(answerSchema.safeParse(filled).success).toBe(true);
    expect(attemptSchema.safeParse({ cells: [] }).success).toBe(true);
  });

  it("reject a lowercase or multi-letter entry", () => {
    for (const letter of ["c", "CR"]) {
      expect(
        attemptSchema.safeParse({ cells: [{ row: 0, col: 0, letter }] }).success,
      ).toBe(false);
    }
  });
});
