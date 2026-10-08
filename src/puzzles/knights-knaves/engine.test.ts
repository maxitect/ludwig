import { describe, expect, it } from "vitest";
import { consistent, holds, solve } from "./engine";
import type { Claim } from "./schema";

const is = (
  who: string,
  role: "knight" | "knave",
): Extract<Claim, { kind: "is" }> => ({
  kind: "is",
  who,
  role,
});
const speaker = (name: string, ...claims: Claim[]) => ({
  name,
  statements: claims.map((claim) => ({ claim })),
});

describe("holds", () => {
  const names = ["A", "B", "C"];
  const roles = ["knight", "knave", "knave"] as const;

  it.each([
    [is("A", "knight"), true],
    [is("B", "knight"), false],
    [{ kind: "same", a: "B", b: "C" }, true],
    [{ kind: "same", a: "A", b: "B" }, false],
    [{ kind: "different", a: "A", b: "C" }, true],
    [{ kind: "all", of: [is("A", "knight"), is("B", "knave")] }, true],
    [{ kind: "all", of: [is("A", "knight"), is("B", "knight")] }, false],
    [{ kind: "any", of: [is("B", "knight"), is("C", "knave")] }, true],
    [{ kind: "any", of: [is("B", "knight"), is("C", "knight")] }, false],
    [{ kind: "atLeast", role: "knave", n: 2 }, true],
    [{ kind: "atLeast", role: "knave", n: 3 }, false],
    [{ kind: "exactly", role: "knight", n: 1 }, true],
    [{ kind: "exactly", role: "knight", n: 2 }, false],
  ] as [Claim, boolean][])("evaluates %j as %s", (claim, expected) => {
    expect(holds(names, roles, claim)).toBe(expected);
  });

  it("throws on a name that is not a character", () => {
    expect(() => holds(names, roles, is("Z", "knight"))).toThrow(
      /unknown character "Z"/,
    );
  });
});

describe("consistent", () => {
  const pair = [
    speaker("A", { kind: "all", of: [is("A", "knave"), is("B", "knave")] }),
    speaker("B", is("A", "knave")),
  ];

  it("needs a knight's statements true and a knave's false", () => {
    expect(consistent(pair, ["knave", "knight"])).toBe(true);
    expect(consistent(pair, ["knight", "knight"])).toBe(false);
    expect(consistent(pair, ["knave", "knave"])).toBe(false);
  });

  it("makes a knave's every statement false, not just one", () => {
    const both = [speaker("A", is("B", "knave"), is("B", "knight")), speaker("B")];
    for (const b of ["knight", "knave"] as const) {
      expect(consistent(both, ["knave", b])).toBe(false);
      expect(consistent(both, ["knight", b])).toBe(false);
    }
  });
});

describe("solve", () => {
  it("finds the one assignment of a unique puzzle", () => {
    expect(
      solve([
        speaker("A", { kind: "all", of: [is("A", "knave"), is("B", "knave")] }),
        speaker("B", is("A", "knave")),
      ]),
    ).toEqual([["knave", "knight"]]);
  });

  it("finds both assignments of an ambiguous puzzle", () => {
    expect(
      solve([speaker("A", is("B", "knight")), speaker("B", is("A", "knight"))]),
    ).toEqual([
      ["knight", "knight"],
      ["knave", "knave"],
    ]);
  });

  it("finds none for a contradictory puzzle", () => {
    expect(solve([speaker("A", is("A", "knave")), speaker("B")])).toEqual([]);
  });

  it("stops at the limit", () => {
    expect(solve([speaker("A"), speaker("B"), speaker("C")], 3)).toHaveLength(3);
  });
});
