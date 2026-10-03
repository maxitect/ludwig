import { Solver as fixtureSolver } from "./__fixture/solver";
import { Solver as anagramSolver } from "./anagram/solver";
import type { SolverComponent } from "./solver-types";

/** Client solvers by type key. Only the solve page imports this; the registry and scripts must never reach it. */
export const solvers: Readonly<Record<string, SolverComponent | null>> = {
  __fixture: fixtureSolver,
  anagram: anagramSolver,
  gears: null,
  "reverse-chess": null,
  rota: null,
};

export function getSolver(typeKey: string) {
  return Object.hasOwn(solvers, typeKey) ? solvers[typeKey] : null;
}
