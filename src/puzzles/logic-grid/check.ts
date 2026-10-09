import { falseCluePosition, linkedPairs, pairKey } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Every pair of categories (by position) whose links in `answer` differ from the solution's, with
 * whether the answer links any item across it. Only the linked ones may be named to the player.
 */
function differingPairs(payload: Payload, solution: Solution, answer: Answer) {
  const expected = linkedPairs(payload, solution.links);
  const given = linkedPairs(payload, answer.links);
  return payload.categories.flatMap((first, i) =>
    payload.categories.slice(i + 1).flatMap((second) => {
      const keys = first.items.flatMap((a) =>
        second.items.map((b) => pairKey(a.id, b.id)),
      );
      if (!keys.some((key) => expected.has(key) !== given.has(key))) return [];
      return [
        {
          first: first.position,
          second: second.position,
          linked: keys.some((key) => given.has(key)),
        },
      ];
    }),
  );
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const differing = differingPairs(payload, solution, answer);
  const flagged = falseCluePosition(solution.clues);
  return {
    correct:
      differing.length === 0 &&
      (flagged === null || answer.falseCluePosition === flagged),
    wrongParts: differing
      .filter(({ linked }) => linked)
      .map(({ first, second }) => ({ first, second })),
  };
}
