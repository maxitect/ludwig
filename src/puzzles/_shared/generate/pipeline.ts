import { hashSeed, mulberry32 } from "../prng";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const difficulties: ReadonlyArray<Difficulty> = [1, 2, 3, 4, 5];

export function isDifficulty(value: number): value is Difficulty {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/** A generated puzzle and the number of candidates the pipeline tried to find it. */
export type Generated<Content> = { content: Content; attempts: number };

/** One frozen generator per version. Never edit an entry: add a new version instead. */
export type GeneratorVersions<Content> = Readonly<
  Record<number, (seed: string, difficulty: Difficulty) => Generated<Content>>
>;

/** The one source of randomness of a generator run: the same seed and difficulty replay the same sequence. */
export function seedRng(seed: string, difficulty: Difficulty) {
  return mulberry32(hashSeed(`${seed}:${difficulty}`));
}

/** Fisher-Yates over the seeded generator. */
export function shuffle<T>(rng: () => number, items: ReadonlyArray<T>) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draws candidates from one seeded stream until one grades at the target difficulty. A candidate
 * is a unique puzzle the type's grader solved by technique alone; `null` rejects it.
 */
export function generateGraded<Content>(
  seed: string,
  difficulty: Difficulty,
  maxAttempts: number,
  candidate: (
    rng: () => number,
  ) => { content: Content; difficulty: Difficulty } | null,
): Generated<Content> {
  const rng = seedRng(seed, difficulty);
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    const found = candidate(rng);
    if (found && found.difficulty === difficulty) {
      return { content: found.content, attempts };
    }
  }
  throw new Error(
    `no difficulty ${difficulty} puzzle found for seed "${seed}" in ${maxAttempts} candidates`,
  );
}

export function resolveVersion<Content>(
  versions: GeneratorVersions<Content>,
  name: string,
  version: number,
) {
  const generator = Object.hasOwn(versions, version)
    ? versions[version]
    : undefined;
  if (!generator) {
    throw new Error(`Unknown ${name} generator version: ${version}`);
  }
  return generator;
}
