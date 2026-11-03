import { countSolutions, portKey, portOnEdge } from "./engine";
import type { Content } from "./schema";

const at = (row: number, col: number) => `row ${row + 1}, column ${col + 1}`;

/**
 * Cells and ports are distinct, no slot shares a cell with a fixed mirror, every port is on a real
 * edge, every letter is on exactly two ports, and the puzzle has exactly one solution.
 */
export function verifyReflections(content: Content) {
  const { fixedMirrors, slots, ports } = content;
  const fixed = new Set<string>();
  for (const { row, col } of fixedMirrors) {
    const key = `${row},${col}`;
    if (fixed.has(key)) throw new Error(`duplicate fixed mirror at ${at(row, col)}`);
    fixed.add(key);
  }
  const seen = new Set<string>();
  for (const { row, col } of slots) {
    const key = `${row},${col}`;
    if (fixed.has(key)) {
      throw new Error(`slot shares a cell with a fixed mirror at ${at(row, col)}`);
    }
    if (seen.has(key)) throw new Error(`duplicate slot at ${at(row, col)}`);
    seen.add(key);
  }
  const placed = new Set<string>();
  const uses = new Map<string, number>();
  for (const port of ports) {
    if (!portOnEdge(content, port)) {
      throw new Error(
        `port ${port.label} at ${port.side}${port.offset} is not on the ${port.side} edge`,
      );
    }
    if (placed.has(portKey(port))) {
      throw new Error(`two ports at ${port.side}${port.offset}`);
    }
    placed.add(portKey(port));
    uses.set(port.label, (uses.get(port.label) ?? 0) + 1);
  }
  for (const [label, count] of uses) {
    if (count !== 2) {
      throw new Error(`label ${label} appears ${count} times, not twice`);
    }
  }
  const solutions = countSolutions(content, 2);
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
