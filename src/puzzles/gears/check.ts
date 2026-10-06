import { lcmTeeth } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

const pairKey = ({ gearAId, gearBId }: Solution["swaps"][number]) =>
  [gearAId, gearBId].sort().join("|");

const sameSwapSet = (a: Solution["swaps"], b: Solution["swaps"]) => {
  const given = new Set(a.map(pairKey));
  const expected = new Set(b.map(pairKey));
  return (
    a.length === given.size &&
    given.size === expected.size &&
    [...given].every((key) => expected.has(key))
  );
};

export function check(payload: Payload, solution: Solution, answer: Answer) {
  if (!payload.gears.some((gear) => gear.id === answer.accusedGearId)) {
    throw new Error("Accused gear does not belong to this puzzle");
  }
  const cranks = lcmTeeth(payload.gears);
  return {
    correct:
      sameSwapSet(answer.swaps, solution.swaps) &&
      answer.crank % cranks === solution.crank % cranks &&
      answer.convergence === solution.convergence &&
      answer.accusedGearId === solution.killerGearId,
  };
}
