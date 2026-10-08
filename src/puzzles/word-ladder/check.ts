import { letterDifferences } from "./derive";
import type { Answer, Payload, RungProblem, Solution } from "./schema";

/**
 * Accepts any ladder of the right length from the start word to the end word, where each step
 * changes exactly one letter, every rung is a dictionary word and no word is used twice. `isWord`
 * is the dictionary lookup. The problems depend only on the answer and the dictionary, so they
 * never hint at the reference ladder.
 */
export function checkLadder(
  { startWord, endWord, rungCount }: Payload,
  ladder: string[],
  isWord: (word: string) => boolean,
): { correct: boolean; rungProblems: RungProblem[] } {
  const endpointsOk =
    ladder.length === rungCount + 2 &&
    ladder[0] === startWord &&
    ladder[ladder.length - 1] === endWord;
  const rungProblems: RungProblem[] = [];
  for (let i = 1; i < ladder.length - 1; i++) {
    const word = ladder[i];
    const isLast = i === ladder.length - 2;
    const reason: RungProblem["reason"] | null = !isWord(word)
      ? "not-a-word"
      : letterDifferences(ladder[i - 1], word) !== 1 ||
          (isLast && letterDifferences(word, ladder[i + 1]) !== 1)
        ? "not-one-step"
        : ladder.indexOf(word) !== ladder.lastIndexOf(word)
          ? "repeated"
          : null;
    if (reason) rungProblems.push({ position: i - 1, reason });
  }
  return {
    correct: endpointsOk && rungProblems.length === 0,
    rungProblems,
  };
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const words = new Set(solution.dictionary);
  return checkLadder(payload, answer.ladder, (word) => words.has(word));
}
