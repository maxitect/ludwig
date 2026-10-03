import { findDifferenceAt, generateScene } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** Correct when the taps land in every derived difference region. */
export function check(
  _payload: Payload,
  { sceneSeed, differenceCount, generatorVersion }: Solution,
  { taps }: Answer,
) {
  const { differences } = generateScene(
    sceneSeed,
    differenceCount,
    generatorVersion,
  );
  const found = new Set(
    taps.flatMap((tap) => findDifferenceAt(differences, tap)?.index ?? []),
  );
  return { correct: found.size === differences.length };
}
