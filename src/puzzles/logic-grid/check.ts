import { falseCluePosition, linkedPairs, pairKey } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/** The category pairs (by position) whose links in `answer` differ from the solution's. */
export function wrongPairs(
  payload: Payload,
  solution: Solution,
  answer: Answer,
) {
  const expected = linkedPairs(payload, solution.links);
  const given = linkedPairs(payload, answer.links);
  const category = new Map(
    payload.categories.flatMap(({ position, items }) =>
      items.map(({ id }) => [id, position] as const),
    ),
  );
  const wrong = new Set<string>();
  const ids = [...category.keys()];
  for (const a of ids) {
    for (const b of ids) {
      const key = pairKey(a, b);
      const first = category.get(a) ?? 0;
      const second = category.get(b) ?? 0;
      if (first < second && expected.has(key) !== given.has(key)) {
        wrong.add(`${first},${second}`);
      }
    }
  }
  return [...wrong].sort().map((pair) => {
    const [first, second] = pair.split(",").map(Number);
    return { first, second };
  });
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const flagged = falseCluePosition(solution.clues);
  return {
    correct:
      wrongPairs(payload, solution, answer).length === 0 &&
      (flagged === null || answer.falseCluePosition === flagged),
  };
}
