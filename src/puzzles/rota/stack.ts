import { applySwaps, type Placement, type Square, type Swap } from "./engine";

export type StackStep = {
  step: number;
  swap: Swap;
  from: Square;
  to: Square;
};

/** Zone name such as "D4". */
export const zoneName = ({ file, rank }: Square) =>
  `${file.toUpperCase()}${rank}`;

/**
 * The player unswaps from the final rota backwards, so the forward answer is the unswaps reversed.
 * Each step records the two zones the pair stood on at the moment it was unswapped.
 */
export function stackSteps(final: Placement, swaps: Swap[]) {
  const steps: StackStep[] = [];
  let current = final;
  [...swaps].reverse().forEach((swap, index) => {
    steps.push({
      step: index + 1,
      swap,
      from: current[swap.workerAId],
      to: current[swap.workerBId],
    });
    current = applySwaps(current, [swap]);
  });
  return steps;
}

/** The placement after every unswap on the stack. */
export function unswapped(final: Placement, swaps: Swap[]) {
  return applySwaps(final, [...swaps].reverse());
}

/** Adds an unswap to the stack. The answer is kept in forward order, so the newest unswap comes first. */
export function pushUnswap(swaps: Swap[], swap: Swap) {
  return [swap, ...swaps];
}

/** Removes the newest unswap. */
export function popUnswap(swaps: Swap[]) {
  return swaps.slice(1);
}

/** The shortest prefix (at least two letters) of each name that no other worker shares, for the board tokens. */
export function tokenLabels(names: readonly string[]) {
  return Object.fromEntries(
    names.map((name) => {
      const others = names.filter((other) => other !== name);
      let length = Math.min(2, name.length);
      while (
        length < name.length &&
        others.some((other) =>
          other.toUpperCase().startsWith(name.slice(0, length).toUpperCase()),
        )
      ) {
        length += 1;
      }
      return [name, name.slice(0, length).toUpperCase()];
    }),
  );
}
