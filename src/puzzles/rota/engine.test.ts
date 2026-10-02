import { describe, expect, it } from "vitest";
import {
  applySwaps,
  openingGambit,
  type Placement,
  placementFor,
  solve,
  type Square,
  validateClues,
} from "./engine";
import type { ClueParams } from "./schema";

const sq = (file: Square["file"], rank: number): Square => ({ file, rank });

/** Worker ids are their names. A staircase of work zones a1, a2, b2, b3, c3. */
const intended: Placement = {
  Marty: sq("a", 1),
  Gary: sq("a", 2),
  Ojay: sq("b", 2),
  Stefan: sq("b", 3),
  Zara: sq("c", 3),
};
const final: Placement = {
  Marty: sq("b", 3),
  Gary: sq("a", 1),
  Ojay: sq("a", 2),
  Stefan: sq("b", 2),
  Zara: sq("c", 3),
};
const chain = [
  { workerAId: "Marty", workerBId: "Gary" },
  { workerAId: "Marty", workerBId: "Ojay" },
  { workerAId: "Marty", workerBId: "Stefan" },
];

const adjacentOnly: ClueParams = { kind: "adjacent_only" };
const maxThree: ClueParams = { kind: "max_swaps", maxSwaps: 3 };
const clues: ClueParams[] = [adjacentOnly, maxThree];

describe("applySwaps", () => {
  it("applies the swaps forwards from the intended rota", () => {
    expect(applySwaps(intended, chain)).toEqual(final);
  });

  it("is the identity for no swaps and does not mutate its input", () => {
    expect(applySwaps(intended, [])).toEqual(intended);
    expect(intended.Marty).toEqual(sq("a", 1));
  });

  it("throws on an unknown worker", () => {
    expect(() =>
      applySwaps(intended, [{ workerAId: "Marty", workerBId: "Nobody" }]),
    ).toThrow("Unknown worker: Nobody");
  });
});

describe("validateClues", () => {
  it("unpowered_square: passes when no swap touches the square, fails when one does", () => {
    const clue = (file: Square["file"], rank: number): ClueParams => ({
      kind: "unpowered_square",
      file,
      rank,
    });
    expect(validateClues(intended, chain, [clue("c", 3)])).toBe(true);
    expect(validateClues(intended, chain, [clue("b", 2)])).toBe(false);
    expect(validateClues(intended, chain, [clue("a", 1)])).toBe(false);
  });

  it("adjacent_only: passes for orthogonal neighbours, fails otherwise", () => {
    expect(validateClues(intended, chain, [adjacentOnly])).toBe(true);
    expect(
      validateClues(
        intended,
        [{ workerAId: "Marty", workerBId: "Ojay" }],
        [adjacentOnly],
      ),
    ).toBe(false);
    expect(
      validateClues(
        intended,
        [{ workerAId: "Gary", workerBId: "Stefan" }],
        [adjacentOnly],
      ),
    ).toBe(false);
  });

  it("never_in_rank: considers every state including intended and final", () => {
    const never = (workerId: string, rank: number): ClueParams => ({
      kind: "never_in_rank",
      workerId,
      rank,
    });
    expect(validateClues(intended, chain, [never("Zara", 1)])).toBe(true);
    expect(validateClues(intended, chain, [never("Marty", 2)])).toBe(false);
    expect(validateClues(intended, chain, [never("Marty", 1)])).toBe(false);
    expect(validateClues(intended, chain, [never("Marty", 3)])).toBe(false);
  });

  it("max_swaps: passes at the limit, fails above it", () => {
    expect(validateClues(intended, chain, [maxThree])).toBe(true);
    expect(
      validateClues(intended, chain, [{ kind: "max_swaps", maxSwaps: 2 }]),
    ).toBe(false);
  });

  it("requires every clue to hold", () => {
    expect(
      validateClues(intended, chain, [
        adjacentOnly,
        { kind: "max_swaps", maxSwaps: 2 },
      ]),
    ).toBe(false);
  });
});

describe("solve", () => {
  it("finds exactly one sequence for the S1E4-style fixture", () => {
    expect(solve(intended, final, clues)).toEqual([
      [
        { workerAId: "Gary", workerBId: "Marty" },
        { workerAId: "Marty", workerBId: "Ojay" },
        { workerAId: "Marty", workerBId: "Stefan" },
      ],
    ]);
  });

  it("counts only the shortest sequences, so undo pairs need no max_swaps clue", () => {
    expect(solve(intended, final, [adjacentOnly])).toEqual(
      solve(intended, final, clues),
    );
    expect(solve(intended, final, [adjacentOnly], { cap: 50 })).toHaveLength(
      1,
    );
  });

  it("finds two (the cap) when a clue is removed", () => {
    const found = solve(intended, final, [maxThree]);
    expect(found).toHaveLength(2);
  });

  it("finds none for a contradictory fixture", () => {
    const contradictory: ClueParams[] = [
      ...clues,
      { kind: "never_in_rank", workerId: "Marty", rank: 1 },
    ];
    expect(solve(intended, final, contradictory)).toEqual([]);
  });

  it("finds the empty sequence first when intended equals final", () => {
    expect(solve(intended, intended, clues, { cap: 1 })).toEqual([[]]);
  });
});

describe("openingGambit", () => {
  it("returns the first swap and its authored instigator", () => {
    expect(
      openingGambit({ swaps: chain, instigatorWorkerId: "Gary" }),
    ).toEqual({ swap: chain[0], instigator: "Gary" });
  });

  it("is undefined when the instigator is not in the first swap", () => {
    expect(
      openingGambit({ swaps: chain, instigatorWorkerId: "Ojay" }),
    ).toBeUndefined();
  });

  it("is undefined for an empty sequence", () => {
    expect(
      openingGambit({ swaps: [], instigatorWorkerId: "Marty" }),
    ).toBeUndefined();
  });
});

describe("placementFor", () => {
  it("reads one phase from the worker squares", () => {
    const workers = [
      {
        id: "w1",
        name: "Marty",
        squares: [
          { phase: "intended" as const, file: "a" as const, rank: 1 },
          { phase: "final" as const, file: "b" as const, rank: 3 },
        ],
      },
    ];
    expect(placementFor(workers, "final")).toEqual({ w1: sq("b", 3) });
  });
});
