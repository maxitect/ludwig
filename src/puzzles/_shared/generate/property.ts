import { readdirSync } from "node:fs";
import { describe, it } from "vitest";
import { difficulties, type Difficulty } from "./pipeline";

/**
 * Registers one slice of a generator property suite: `seeds` seeds per difficulty for each
 * generator, in batches of `batch`, keeping every `slices`-th batch from `slice` (1-based) so
 * each slice gets an even share of every difficulty. Each slice lives in its own test file so
 * Vitest runs the slices in parallel.
 */
export function propertySlice<Name extends string>(
  names: ReadonlyArray<Name>,
  { seeds, batch, slices }: { seeds: number; batch: number; slices: number },
  slice: number,
  check: (name: Name, seed: string, difficulty: Difficulty) => void,
) {
  const cases = names.flatMap((name) =>
    difficulties.flatMap((difficulty) =>
      Array.from({ length: seeds / batch }, (_, index) => ({
        name,
        difficulty,
        from: index * batch,
        to: (index + 1) * batch,
      })),
    ),
  );
  describe(`property slice ${slice} of ${slices}`, () => {
    it.each(cases.filter((_, index) => index % slices === slice - 1))(
      "$name difficulty $difficulty, seeds $from to $to: each unique and solved by technique alone",
      ({ name, difficulty, from, to }) => {
        for (let index = from; index < to; index++) {
          check(name, `property-${index}`, difficulty);
        }
      },
      300_000,
    );
  });
}

/** The number of `<base>.property-<n>.test.ts` slice files in `dir`. */
export function sliceFileCount(dir: string, base: string) {
  const pattern = new RegExp(`^${base}\\.property-\\d+\\.test\\.ts$`);
  return readdirSync(dir).filter((name) => pattern.test(name)).length;
}
