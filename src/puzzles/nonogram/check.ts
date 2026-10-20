import { cluesOf } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any picture whose runs match every clue is correct, and the puzzle has exactly one, so nothing is compared
 * with the stored picture. The caption comes back as `epilogue` only for a correct answer.
 */
export function check(
  { rows, cols, rowClues, colClues }: Payload,
  { caption }: Solution,
  { shaded }: Answer,
): { correct: boolean; epilogue?: string } {
  if (shaded.some((cell) => cell.row >= rows || cell.col >= cols)) {
    return { correct: false };
  }
  const answer = cluesOf(rows, cols, shaded);
  const correct =
    JSON.stringify(answer.rowClues) === JSON.stringify(rowClues) &&
    JSON.stringify(answer.colClues) === JSON.stringify(colClues);
  return correct ? { correct, epilogue: caption } : { correct };
}
