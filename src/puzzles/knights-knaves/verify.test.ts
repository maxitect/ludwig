import { describe, expect, it } from "vitest";
import { content as byTheFire } from "../../../content/knights-knaves/by-the-fire";
import { content as longTable } from "../../../content/knights-knaves/long-table";
import { content as nightFerry } from "../../../content/knights-knaves/night-ferry";
import { content as sideDoor } from "../../../content/knights-knaves/side-door";
import { content as twoAtTheGate } from "../../../content/knights-knaves/two-at-the-gate";
import type { Claim, Content } from "./schema";
import { verifyKnightsKnaves } from "./verify";

const is = (who: string, role: "knight" | "knave"): Claim => ({
  kind: "is",
  who,
  role,
});

const puzzle = (
  characters: [string, "knight" | "knave", Claim][],
): Content => ({
  questionText: "q",
  characters: characters.map(([name, role, claim]) => ({
    name,
    role,
    statements: [{ content: "s", claim }],
  })),
});

describe("verifyKnightsKnaves", () => {
  it.each([twoAtTheGate, longTable, sideDoor, byTheFire, nightFerry])(
    "accepts the shipped content",
    (content) => {
      expect(() => verifyKnightsKnaves(content)).not.toThrow();
    },
  );

  it("accepts a unique puzzle", () => {
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knave", { kind: "same", a: "A", b: "B" }],
          ["B", "knight", is("A", "knave")],
        ]),
      ),
    ).not.toThrow();
  });

  it("rejects an ambiguous puzzle", () => {
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knight", is("B", "knight")],
          ["B", "knight", is("A", "knight")],
        ]),
      ),
    ).toThrow(/more than one assignment/);
  });

  it("rejects a contradictory puzzle", () => {
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knight", is("A", "knave")],
          ["B", "knave", is("A", "knave")],
        ]),
      ),
    ).toThrow(/contradict/);
  });

  it("rejects stored roles that are not the unique assignment", () => {
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knight", { kind: "same", a: "A", b: "B" }],
          ["B", "knave", is("A", "knave")],
        ]),
      ),
    ).toThrow(/not the stored roles/);
  });

  it("rejects a repeated name and an unknown name", () => {
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knight", is("A", "knight")],
          ["A", "knave", is("A", "knight")],
        ]),
      ),
    ).toThrow(/used twice/);
    expect(() =>
      verifyKnightsKnaves(
        puzzle([
          ["A", "knight", is("Z", "knight")],
          ["B", "knave", is("A", "knave")],
        ]),
      ),
    ).toThrow(/unknown character "Z"/);
  });
});
