import { mulberry32 } from "../_shared/prng";
import type { Payload } from "./schema";

export type Wheel = Pick<Payload, "centre" | "rim">;

export type FitFailure = "too-short" | "missing-centre" | "letters";

/** The centre letter and the other eight letters of the target in a seeded order. */
export function deriveWheel(
  targetWord: string,
  centrePosition: number,
  scrambleSeed: number,
): Wheel {
  const letters = [...targetWord];
  const [centre] = letters.splice(centrePosition, 1);
  const random = mulberry32(scrambleSeed);
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return { centre, rim: letters };
}

/** Why a word cannot be played on the wheel, or null when it can. Ignores the dictionary. */
export function fitFailure(
  { centre, rim }: Wheel,
  minLength: number,
  word: string,
): FitFailure | null {
  if (word.length < minLength) return "too-short";
  if (!word.includes(centre)) return "missing-centre";
  const available = new Map<string, number>();
  for (const letter of [centre, ...rim]) {
    available.set(letter, (available.get(letter) ?? 0) + 1);
  }
  for (const letter of word) {
    const left = available.get(letter) ?? 0;
    if (left === 0) return "letters";
    available.set(letter, left - 1);
  }
  return null;
}

export function fits(wheel: Wheel, minLength: number, word: string) {
  return fitFailure(wheel, minLength, word) === null;
}

/** The dictionary words that fit the wheel, each once. */
export function validWords(
  wheel: Wheel,
  minLength: number,
  dictionary: Iterable<string>,
) {
  return [...new Set(dictionary)].filter((word) =>
    fits(wheel, minLength, word),
  );
}

/** Average, Good and Genius at a third, a half and two thirds of the valid words, rounded down. */
export function ratingThresholds(total: number): Payload["thresholds"] {
  return {
    average: Math.floor(total / 3),
    good: Math.floor(total / 2),
    genius: Math.floor((total * 2) / 3),
  };
}

export type Rating = "Genius" | "Good" | "Average" | null;

export function ratingFor(
  found: number,
  { average, good, genius }: Payload["thresholds"],
): Rating {
  if (found >= genius) return "Genius";
  if (found >= good) return "Good";
  if (found >= average) return "Average";
  return null;
}
