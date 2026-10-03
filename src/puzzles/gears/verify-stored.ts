import { type Diagram, solveAll } from "./engine";
import type { Solution } from "./schema";

/** Throws unless re-solving the stored diagram finds exactly the stored solution. */
export function verifyStored(diagram: Diagram, solution: Solution) {
  if (solution.swaps.length) {
    throw new Error("a generated normal puzzle must have no solution swaps");
  }
  const wins = solveAll(diagram);
  if (wins.length !== 1) {
    throw new Error(`expected exactly one solution, found ${wins.length}`);
  }
  const [win] = wins;
  if (
    win.crank !== solution.crank ||
    win.convergence !== solution.convergence ||
    win.killerId !== solution.killerGearId
  ) {
    throw new Error(
      `stored solution (crank ${solution.crank}, figure ${solution.convergence}, gear ${solution.killerGearId}) differs from the solved one (crank ${win.crank}, figure ${win.convergence}, gear ${win.killerId})`,
    );
  }
}
