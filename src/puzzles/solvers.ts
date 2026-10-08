import { Solver as fixtureSolver } from "./__fixture/solver";
import { Solver as anagramSolver } from "./anagram/solver";
import { Solver as bookCipherSolver } from "./book-cipher/solver";
import { Solver as caesarSolver } from "./caesar/solver";
import { Solver as crosswordSolver } from "./crossword/solver";
import { Solver as futoshikiSolver } from "./futoshiki/solver";
import { Solver as gearTrainSolver } from "./gear-train/solver";
import { Solver as gearsSolver } from "./gears/solver";
import { Solver as keywordSolver } from "./keyword/solver";
import { Solver as logicGridSolver } from "./logic-grid/solver";
import { Solver as pictogramCipherSolver } from "./pictogram-cipher/solver";
import { Solver as reverseChessSolver } from "./reverse-chess/solver";
import { Solver as rotaSolver } from "./rota/solver";
import { Solver as spotDifferenceSolver } from "./spot-difference/solver";
import { Solver as sudokuSolver } from "./sudoku/solver";
import { Solver as wordLadderSolver } from "./word-ladder/solver";
import type { SolverComponent } from "./solver-types";

/** Client solvers by type key. Only the solve page imports this; the registry and scripts must never reach it. */
export const solvers: Readonly<Record<string, SolverComponent | null>> = {
  __fixture: fixtureSolver,
  anagram: anagramSolver,
  "book-cipher": bookCipherSolver,
  caesar: caesarSolver,
  crossword: crosswordSolver,
  futoshiki: futoshikiSolver,
  "gear-train": gearTrainSolver,
  gears: gearsSolver,
  keyword: keywordSolver,
  "logic-grid": logicGridSolver,
  "pictogram-cipher": pictogramCipherSolver,
  "reverse-chess": reverseChessSolver,
  rota: rotaSolver,
  "spot-difference": spotDifferenceSolver,
  sudoku: sudokuSolver,
  "word-ladder": wordLadderSolver,
};

export function getSolver(typeKey: string) {
  return Object.hasOwn(solvers, typeKey) ? solvers[typeKey] : null;
}
