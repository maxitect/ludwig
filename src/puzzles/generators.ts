import { z } from "zod";
import type { Grade } from "./_shared/generate/candidates";
import {
  isDifficulty,
  resolveVersion,
  type GeneratorVersions,
} from "./_shared/generate/pipeline";
import { layoutOf } from "./circle9/engine";
import { circle9Generators } from "./circle9/generate";
import { gradeCircle9 } from "./circle9/grade";
import { contentSchema as circle9Content } from "./circle9/schema";
import { numbers } from "./circle9/verify";
import { futoshikiGenerators } from "./futoshiki/generate";
import { gradeFutoshiki } from "./futoshiki/grade";
import { contentSchema as futoshikiContent } from "./futoshiki/schema";
import { starBattleGenerators } from "./star-battle/generate";
import { gradeStarBattle } from "./star-battle/grade";
import { contentSchema as starBattleContent } from "./star-battle/schema";
import { gridFromGivens, unitsFor, variantFor } from "./sudoku/engine";
import { sudokuGenerators } from "./sudoku/generate";
import {
  sudokuJigsawGenerators,
  sudokuRainbowGenerators,
} from "./sudoku/generate-regions";
import {
  sudokuKillerGenerators,
  sudokuXvGenerators,
} from "./sudoku/generate-variants";
import { gradeSudoku } from "./sudoku/grade";
import { contentSchema as sudokuContent } from "./sudoku/schema";
import { troixGenerators } from "./troix/generate";
import { gradeTroix } from "./troix/grade";
import { contentSchema as troixContent } from "./troix/schema";

/**
 * Generators by name, then by frozen version. A name is not always a type key: a variant of a type
 * (jigsaw sudoku) registers its own generator.
 */
export const generators: Readonly<Record<string, GeneratorVersions<object>>> =
  {
    circle9: circle9Generators,
    futoshiki: futoshikiGenerators,
    "star-battle": starBattleGenerators,
    sudoku: sudokuGenerators,
    "sudoku-jigsaw": sudokuJigsawGenerators,
    "sudoku-killer": sudokuKillerGenerators,
    "sudoku-rainbow": sudokuRainbowGenerators,
    "sudoku-xv": sudokuXvGenerators,
    troix: troixGenerators,
  };

/** Provenance a generated content file exports beside `meta` and `content`. Read by `puzzles:verify`, never seeded. */
export const generatedSchema = z.strictObject({
  generator: z.string().min(1),
  version: z.int().positive(),
  seed: z.string().min(1),
});

export type Provenance = z.infer<typeof generatedSchema>;

export function regenerate(
  { generator, version, seed }: Provenance,
  difficulty: number,
) {
  if (!isDifficulty(difficulty)) {
    throw new Error(`difficulty ${difficulty} is not between 1 and 5`);
  }
  const versions = Object.hasOwn(generators, generator)
    ? generators[generator]
    : undefined;
  if (!versions) throw new Error(`Unknown generator: ${generator}`);
  return resolveVersion(versions, generator, version)(seed, difficulty);
}

/** Grades a type's content by technique alone, or null when it needs trial and error. */
const graders: Readonly<Record<string, (content: unknown) => Grade | null>> = {
  circle9: (content) =>
    gradeCircle9(
      layoutOf({ numbers: numbers(circle9Content.parse(content)) }),
    ),
  futoshiki: (content) => gradeFutoshiki(futoshikiContent.parse(content)),
  "star-battle": (content) =>
    gradeStarBattle(starBattleContent.parse(content)),
  sudoku: (content) => {
    const { givens, regions, cages, xv } = sudokuContent.parse(content);
    return gradeSudoku(
      gridFromGivens(givens),
      5,
      unitsFor(regions),
      variantFor({ cages, xv }),
    );
  },
  troix: (content) => gradeTroix(troixContent.parse(content)),
};

export const gradedTypes = Object.keys(graders);

export function gradeContent(typeKey: string, content: unknown) {
  const grader = Object.hasOwn(graders, typeKey) ? graders[typeKey] : undefined;
  if (!grader) throw new Error(`No grader for type: ${typeKey}`);
  return grader(content);
}
