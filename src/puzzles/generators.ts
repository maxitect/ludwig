import { z } from "zod";
import type { Grade } from "./_shared/generate/candidates";
import {
  isDifficulty,
  resolveVersion,
  type GeneratorVersions,
} from "./_shared/generate/pipeline";
import { futoshikiGenerators } from "./futoshiki/generate";
import { gradeFutoshiki } from "./futoshiki/grade";
import { contentSchema as futoshikiContent } from "./futoshiki/schema";
import { gridFromGivens } from "./sudoku/engine";
import { sudokuGenerators } from "./sudoku/generate";
import { gradeSudoku } from "./sudoku/grade";
import { contentSchema as sudokuContent } from "./sudoku/schema";

/**
 * Generators by name, then by frozen version. A name is not always a type key: a variant of a type
 * (jigsaw sudoku) registers its own generator.
 */
export const generators: Readonly<Record<string, GeneratorVersions<object>>> =
  {
    sudoku: sudokuGenerators,
    futoshiki: futoshikiGenerators,
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
  sudoku: (content) =>
    gradeSudoku(gridFromGivens(sudokuContent.parse(content).givens)),
  futoshiki: (content) => gradeFutoshiki(futoshikiContent.parse(content)),
};

export const gradedTypes = Object.keys(graders);

export function gradeContent(typeKey: string, content: unknown) {
  const grader = Object.hasOwn(graders, typeKey) ? graders[typeKey] : undefined;
  if (!grader) throw new Error(`No grader for type: ${typeKey}`);
  return grader(content);
}
