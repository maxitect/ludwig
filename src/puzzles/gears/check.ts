import { lcmTeeth } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

export function check(payload: Payload, solution: Solution, answer: Answer) {
  if (!payload.gears.some((gear) => gear.id === answer.accusedGearId)) {
    throw new Error("Accused gear does not belong to this puzzle");
  }
  const cranks = lcmTeeth(payload.gears);
  return {
    correct:
      answer.crank % cranks === solution.crank % cranks &&
      answer.convergence === solution.convergence &&
      answer.accusedGearId === solution.killerGearId,
  };
}
