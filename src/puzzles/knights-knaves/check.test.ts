import { describe, expect, it } from "vitest";
import { check } from "./check";
import type { Payload, Solution } from "./schema";

const payload: Payload = {
  questionText: "q",
  characters: [
    { position: 0, name: "A", statements: ["x"] },
    { position: 1, name: "B", statements: ["y"] },
    { position: 2, name: "C", statements: ["z"] },
  ],
};
const solution: Solution = [
  { position: 0, role: "knight" },
  { position: 1, role: "knave" },
  { position: 2, role: "knave" },
];

describe("check", () => {
  it("accepts every role right, in any order", () => {
    expect(check(payload, solution, { roles: solution })).toEqual({
      correct: true,
      wrong: 0,
    });
    expect(
      check(payload, solution, { roles: [...solution].reverse() }).correct,
    ).toBe(true);
  });

  it("counts the wrong roles without naming them", () => {
    const one = solution.map((entry) =>
      entry.position === 1 ? { ...entry, role: "knight" as const } : entry,
    );
    expect(check(payload, solution, { roles: one })).toEqual({
      correct: false,
      wrong: 1,
    });
    const all = solution.map((entry) => ({
      ...entry,
      role: entry.role === "knight" ? ("knave" as const) : ("knight" as const),
    }));
    expect(check(payload, solution, { roles: all })).toEqual({
      correct: false,
      wrong: 3,
    });
  });

  it("counts a character left out as wrong", () => {
    expect(
      check(payload, solution, { roles: solution.slice(0, 2) }),
    ).toEqual({ correct: false, wrong: 1 });
  });
});
