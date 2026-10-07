import { describe, expect, it } from "vitest";
import {
  popUnswap,
  pushUnswap,
  stackSteps,
  tokenLabels,
  unswapped,
} from "./stack";

const final = {
  A: { file: "a" as const, rank: 1 },
  B: { file: "b" as const, rank: 1 },
  C: { file: "c" as const, rank: 1 },
};
const ab = { workerAId: "A", workerBId: "B" };
const bc = { workerAId: "B", workerBId: "C" };

describe("unswap stack", () => {
  it("keeps the answer in forward order, newest unswap first", () => {
    expect(pushUnswap(pushUnswap([], bc), ab)).toEqual([ab, bc]);
    expect(popUnswap([ab, bc])).toEqual([bc]);
  });

  it("applies the unswaps backwards from the final rota", () => {
    expect(unswapped(final, [ab, bc]).A).toEqual(final.C);
    expect(unswapped(final, [ab, bc]).B).toEqual(final.A);
    expect(unswapped(final, [])).toEqual(final);
  });

  it("records the zones each unswap swapped, in unswap order", () => {
    const steps = stackSteps(final, [ab, bc]);
    expect(steps.map(({ swap }) => swap)).toEqual([bc, ab]);
    expect(steps[0]).toMatchObject({ step: 1, from: final.B, to: final.C });
    expect(steps[1]).toMatchObject({ step: 2, from: final.A, to: final.C });
  });

  it("labels tokens with the shortest unique prefix of two or more letters", () => {
    expect(tokenLabels(["Colm", "Cole", "Bea"])).toEqual({
      Colm: "COLM",
      Cole: "COLE",
      Bea: "BE",
    });
  });
});
