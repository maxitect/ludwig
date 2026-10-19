import { falseCluePosition, linkedPairs, pairKey } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Every pair of categories (by position) in which `answer` links two items the solution does not.
 * A wrong link is judged where the player made it, never through the links it implies elsewhere.
 */
function wrongPairs(payload: Payload, expected: ReadonlySet<string>, answer: Answer) {
  const given = new Set(
    answer.links.map(({ itemAId, itemBId }) => pairKey(itemAId, itemBId)),
  );
  return payload.categories.flatMap((first, i) =>
    payload.categories.slice(i + 1).flatMap((second) => {
      const wrong = first.items.some((a) =>
        second.items.some(
          (b) => given.has(pairKey(a.id, b.id)) && !expected.has(pairKey(a.id, b.id)),
        ),
      );
      return wrong ? [{ first: first.position, second: second.position }] : [];
    }),
  );
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const expected = linkedPairs(payload, solution.links);
  const wrongParts = wrongPairs(payload, expected, answer);
  const flagged = falseCluePosition(solution.clues);
  return {
    correct:
      wrongParts.length === 0 &&
      linkedPairs(payload, answer.links).size === expected.size &&
      (flagged === null || answer.falseCluePosition === flagged),
    wrongParts,
  };
}
