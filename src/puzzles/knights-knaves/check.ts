import type { Answer, Payload, Solution } from "./schema";

/** Every character needs the right role; `wrong` is only how many are not, never which. */
export function check(payload: Payload, solution: Solution, answer: Answer) {
  const given = new Map(answer.roles.map(({ position, role }) => [position, role]));
  const wrong = payload.characters.filter(
    ({ position }) =>
      given.get(position) !== solution.find((entry) => entry.position === position)?.role,
  ).length;
  return { correct: wrong === 0, wrong };
}
