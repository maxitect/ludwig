import { Solver as fixtureSolver } from "./__fixture/solver";
import { Solver as anagramSolver } from "./anagram/solver";
import { Solver as crosswordSolver } from "./crossword/solver";
import { Solver as gearsSolver } from "./gears/solver";
import { Solver as reverseChessSolver } from "./reverse-chess/solver";
import { Solver as spotDifferenceSolver } from "./spot-difference/solver";
import { Solver as sudokuSolver } from "./sudoku/solver";
import type { SolverComponent } from "./solver-types";

/** Client solvers by type key. Only the solve page imports this; the registry and scripts must never reach it. */
export const solvers: Readonly<Record<string, SolverComponent | null>> = {
  __fixture: fixtureSolver,
  anagram: anagramSolver,
  crossword: crosswordSolver,
  gears: gearsSolver,
  "reverse-chess": reverseChessSolver,
  rota: null,
  "spot-difference": spotDifferenceSolver,
  sudoku: sudokuSolver,
};

export function getSolver(typeKey: string) {
  return Object.hasOwn(solvers, typeKey) ? solvers[typeKey] : null;
}
