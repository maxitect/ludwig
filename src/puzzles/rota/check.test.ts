import { describe, expect, it } from "vitest";
import { brokenClues, check } from "./check";
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
    {
      position: 1,
      displayText: "At most three",
      kind: "max_swaps",
      maxSwaps: 3,
    },
  ],
};
const swaps: Answer["swaps"] = [
  { workerAId: "Marty", workerBId: "Gary" },
  { workerAId: "Marty", workerBId: "Ojay" },
  { workerAId: "Marty", workerBId: "Stefan" },
];
const solution: Solution = { instigatorWorkerId: "Marty", swaps };
const answer: Answer = { swaps };

describe("rota check", () => {
  it("accepts the correct answer", () => {
    expect(check(payload, solution, answer)).toEqual({
      correct: true,
      epilogue: "Opening gambit: Marty insisted on it.",
    });
  });

  it("does not depend on the instigator, and reveals it only for a correct answer", () => {
    const other = { ...solution, instigatorWorkerId: "Gary" };
    expect(check(payload, other, answer).correct).toBe(true);
    expect(check(payload, other, answer).epilogue).toBe(
      "Opening gambit: Gary insisted on it.",
    );
    const wrong = check(payload, solution, { swaps: swaps.slice(0, 2) });
    expect(wrong.correct).toBe(false);
    expect(wrong).not.toHaveProperty("epilogue");
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
      check({ ...payload, clues: [] }, solution, {
        ...answer,
        swaps: farApart,
      }),
    ).toMatchObject({ correct: true });
    expect(check(payload, solution, { ...answer, swaps: farApart })).toEqual({
      correct: false,
      violatedClue: 0,
    });
    expect(
      brokenClues(payload, farApart).map(({ displayText }) => displayText),
    ).toEqual(["Only neighbours swap"]);
    expect(brokenClues(payload, swaps)).toEqual([]);
  });

  it("names a broken clue from the payload and answer alone, so the result shape never hints at the solution", () => {
    const farApart = [
      { workerAId: "Marty", workerBId: "Stefan" },
      { workerAId: "Stefan", workerBId: "Gary" },
    ];
    const results = [
      check(payload, solution, { swaps: farApart }),
      check(
        payload,
        { ...solution, instigatorWorkerId: "Gary" },
        { swaps: farApart },
      ),
    ];
    for (const result of results) {
      expect(Object.keys(result)).toEqual(["correct", "violatedClue"]);
      expect(result).toEqual({ correct: false, violatedClue: 0 });
    }
  });

  it("rejects a longer sequence padded with an undo pair", () => {
    const unconstrained = { ...payload, clues: [] };
    const padded = [
      swaps[0],
      { workerAId: "Stefan", workerBId: "Zara" },
      { workerAId: "Stefan", workerBId: "Zara" },
      ...swaps.slice(1),
    ];
    expect(check(unconstrained, solution, answer)).toMatchObject({
      correct: true,
    });
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
