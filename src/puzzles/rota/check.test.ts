import { describe, expect, it } from "vitest";
import { check, violatedClue } from "./check";
import type { Answer, Payload, Solution } from "./schema";

const worker = (
  id: string,
  intended: [Payload["workers"][number]["squares"][number]["file"], number],
  final: [Payload["workers"][number]["squares"][number]["file"], number],
) => ({
  id,
  name: id,
  squares: [
    { phase: "intended" as const, file: intended[0], rank: intended[1] },
    { phase: "final" as const, file: final[0], rank: final[1] },
  ],
});

const payload: Payload = {
  workers: [
    worker("Marty", ["a", 1], ["b", 3]),
    worker("Gary", ["a", 2], ["a", 1]),
    worker("Ojay", ["b", 2], ["a", 2]),
    worker("Stefan", ["b", 3], ["b", 2]),
    worker("Zara", ["c", 3], ["c", 3]),
  ],
  clues: [
    { position: 0, displayText: "Only neighbours swap", kind: "adjacent_only" },
    { position: 1, displayText: "At most three", kind: "max_swaps", maxSwaps: 3 },
  ],
};
const swaps: Answer["swaps"] = [
  { workerAId: "Marty", workerBId: "Gary" },
  { workerAId: "Marty", workerBId: "Ojay" },
  { workerAId: "Marty", workerBId: "Stefan" },
];
const solution: Solution = { instigatorWorkerId: "Marty", swaps };
const answer: Answer = { instigatorWorkerId: "Marty", swaps };

describe("rota check", () => {
  it("accepts the correct answer", () => {
    expect(check(payload, solution, answer)).toEqual({ correct: true });
  });

  it("rejects the wrong instigator", () => {
    expect(
      check(payload, solution, { ...answer, instigatorWorkerId: "Gary" }),
    ).toEqual({ correct: false });
  });

  it("rejects an instigator outside the first swap", () => {
    const outside = { ...solution, instigatorWorkerId: "Zara" };
    expect(
      check(payload, outside, { ...answer, instigatorWorkerId: "Zara" }),
    ).toEqual({ correct: false });
  });

  it("rejects a sequence that misses the final state", () => {
    expect(
      check(payload, solution, { ...answer, swaps: swaps.slice(0, 2) }),
    ).toEqual({ correct: false });
  });

  it("rejects a sequence that breaks a clue", () => {
    const farApart = [
      { workerAId: "Marty", workerBId: "Stefan" },
      { workerAId: "Stefan", workerBId: "Gary" },
      { workerAId: "Stefan", workerBId: "Ojay" },
    ];
    expect(
      check({ ...payload, clues: [] }, solution, { ...answer, swaps: farApart }),
    ).toEqual({ correct: true });
    expect(check(payload, solution, { ...answer, swaps: farApart })).toEqual({
      correct: false,
      violatedClue: 0,
    });
    expect(violatedClue(payload, farApart)?.displayText).toBe(
      "Only neighbours swap",
    );
    expect(violatedClue(payload, swaps)).toBeUndefined();
  });

  it("rejects a longer sequence padded with an undo pair", () => {
    const unconstrained = { ...payload, clues: [] };
    const padded = [
      swaps[0],
      { workerAId: "Stefan", workerBId: "Zara" },
      { workerAId: "Stefan", workerBId: "Zara" },
      ...swaps.slice(1),
    ];
    expect(check(unconstrained, solution, answer)).toEqual({ correct: true });
    expect(
      check(unconstrained, solution, { ...answer, swaps: padded }),
    ).toEqual({ correct: false });
  });

  it("rejects a swap of a worker with itself", () => {
    const selfSwap = [{ workerAId: "Zara", workerBId: "Zara" }, ...swaps];
    expect(
      check(
        { ...payload, clues: [] },
        { ...solution, swaps: selfSwap },
        { ...answer, swaps: selfSwap },
      ),
    ).toEqual({ correct: false });
  });

  it("rejects an empty sequence and unknown workers", () => {
    expect(check(payload, solution, { ...answer, swaps: [] })).toEqual({
      correct: false,
    });
    expect(
      check(payload, solution, {
        ...answer,
        swaps: [{ workerAId: "Marty", workerBId: "Nobody" }],
      }),
    ).toEqual({ correct: false });
  });
});
