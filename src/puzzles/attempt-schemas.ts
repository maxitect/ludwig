import { attemptSchema as anagramAttempt } from "./anagram/schema";
import { attemptSchema as crosswordAttempt } from "./crossword/schema";
import { attemptSchema as gearsAttempt } from "./gears/schema";
import { attemptSchema as reverseChessAttempt } from "./reverse-chess/schema";
import { attemptSchema as rotaAttempt } from "./rota/schema";
import { attemptSchema as spotDifferenceAttempt } from "./spot-difference/schema";
import { attemptSchema as sudokuAttempt } from "./sudoku/schema";

/** Attempt schemas for the types that have a solver, importable from client code (the registry is not). */
const attemptSchemas = {
  anagram: anagramAttempt,
  crossword: crosswordAttempt,
  gears: gearsAttempt,
  "reverse-chess": reverseChessAttempt,
  rota: rotaAttempt,
  "spot-difference": spotDifferenceAttempt,
  sudoku: sudokuAttempt,
} as const;

export function getAttemptSchema(typeKey: string) {
  return Object.hasOwn(attemptSchemas, typeKey)
    ? attemptSchemas[typeKey as keyof typeof attemptSchemas]
    : null;
}
