import { applySwaps, type Diagram, solveAll } from "./engine";
import { diagramOf, repairsOf } from "./generate";
import type { Content, Solution } from "./schema";

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

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

/**
 * Content check for `puzzles:verify`. A plain diagram has exactly one solution. A Fix the
 * Diagram variant has none as printed, exactly one repair of at most `maxAdjustments` swaps,
 * and that repair is the stored one.
 */
export function verifyContent(content: Content) {
  const printed = diagramOf(content);
  const { solution } = content;
  const stored = {
    crank: solution.crank,
    convergence: solution.convergence,
    killerGearId: solution.killerLabel,
    swaps: [],
  };
  if (!solution.swaps.length) {
    if (content.maxAdjustments) {
      throw new Error("a Fix the Diagram puzzle must store its repair swaps");
    }
    verifyStored(printed, stored);
    return;
  }
  const printedWins = solveAll(printed).length;
  if (printedWins !== 0) {
    throw new Error(
      `the printed diagram must have no solution, found ${printedWins}`,
    );
  }
  const repairs = repairsOf(printed, content.maxAdjustments);
  const expected = solution.swaps.map(({ a, b }) => pairKey(a, b)).sort();
  const found = repairs.map((swaps) =>
    swaps.map(({ gearAId, gearBId }) => pairKey(gearAId, gearBId)).sort(),
  );
  if (found.length !== 1 || found[0]!.join(",") !== expected.join(",")) {
    throw new Error(
      `expected exactly the stored repair, found ${found.length} repair(s)`,
    );
  }
  verifyStored(applySwaps(printed, repairs[0]!), stored);
}
