import { falseCluePosition, linkedPairs, pairKey } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/** The category pairs (by position) whose links in `answer` differ from the solution's. */
function wrongPairs(
  payload: Payload,
  solution: Solution,
  answer: Answer,
) {
  const expected = linkedPairs(payload, solution.links);
  const given = linkedPairs(payload, answer.links);
  return payload.categories.flatMap((first, i) =>
    payload.categories
      .slice(i + 1)
      .filter((second) =>
        first.items.some((a) =>
          second.items.some((b) => {
            const key = pairKey(a.id, b.id);
            return expected.has(key) !== given.has(key);
          }),
        ),
      )
      .map((second) => ({ first: first.position, second: second.position })),
  );
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const wrong = wrongPairs(payload, solution, answer);
  const flagged = falseCluePosition(solution.clues);
  return {
    correct:
      wrong.length === 0 &&
      (flagged === null || answer.falseCluePosition === flagged),
    wrongPairs: wrong,
  };
}
