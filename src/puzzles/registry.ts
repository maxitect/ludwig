import type { z } from "zod";
import type { db } from "@/db";
import type { puzzleTypes } from "@/db/schema";
import { anagramModule } from "./anagram/module";
import { crosswordModule } from "./crossword/module";
import { futoshikiModule } from "./futoshiki/module";
import { gearsModule } from "./gears/module";
import { reverseChessModule } from "./reverse-chess/module";
import { rotaModule } from "./rota/module";
import { spotDifferenceModule } from "./spot-difference/module";
import { sudokuModule } from "./sudoku/module";

export type Tx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

export type PuzzleSchemas = {
  payloadSchema: z.ZodType;
  answerSchema: z.ZodType;
  contentSchema: z.ZodType;
  attemptSchema: z.ZodType;
};

/** Method signatures keep the parameters bivariant, so one registry can hold modules of different types. */
export type PuzzleTypeModule<
  S extends PuzzleSchemas = PuzzleSchemas,
  TSolution = unknown,
> = {
  schema: S;
  meta: Pick<typeof puzzleTypes.$inferSelect, "key">;
  load(puzzleId: string): Promise<z.infer<S["payloadSchema"]>>;
  loadSolution(puzzleId: string): Promise<TSolution>;
  check(
    payload: z.infer<S["payloadSchema"]>,
    solution: TSolution,
    answer: z.infer<S["answerSchema"]>,
  ): { correct: boolean; epilogue?: string };
  /** Per-cell check for grid types: whether `value` is the solution's value at `(row, col)`. */
  checkCell?(
    payload: z.infer<S["payloadSchema"]>,
    solution: TSolution,
    row: number,
    col: number,
    value: string,
  ): { correct: boolean };
  /** Per-cell reveal for grid types: the one value at `(row, col)`, or null when there is no such cell. */
  revealCell?(solution: TSolution, row: number, col: number): string | null;
  /**
   * Brings the subtype and child rows of a puzzle whose supertype row already exists in line with
   * `content`, in place: upsert on natural keys, delete only rows missing from `content`. Content
   * rows keep their ids and `*_attempt*` tables are never written. Removing a row that attempt
   * data references must fail (FK without cascade), never cascade.
   */
  upsertContent(
    tx: Tx,
    puzzleId: string,
    content: z.infer<S["contentSchema"]>,
  ): Promise<void>;
  /** Replaces the `<type>_attempt*` rows of an attempt with `state`. Runs inside the caller's transaction. */
  replaceAttemptState(
    tx: Tx,
    attemptId: string,
    state: z.infer<S["attemptSchema"]>,
  ): Promise<void>;
  /** Reads back what `replaceAttemptState` wrote, or null when the attempt has no saved state. */
  loadAttemptState(
    attemptId: string,
  ): Promise<z.infer<S["attemptSchema"]> | null>;
  /** Deletes the attempt's saved state, so a reset survives a reload. */
  clearAttemptState(attemptId: string): Promise<void>;
  /** Throws if the content is not uniquely solvable. */
  verify?(content: z.infer<S["contentSchema"]>): void;
};

export type PuzzleRegistry = Readonly<Record<string, PuzzleTypeModule>>;

export const registry: PuzzleRegistry = {
  [anagramModule.meta.key]: anagramModule,
  [crosswordModule.meta.key]: crosswordModule,
  [futoshikiModule.meta.key]: futoshikiModule,
  [gearsModule.meta.key]: gearsModule,
  [reverseChessModule.meta.key]: reverseChessModule,
  [rotaModule.meta.key]: rotaModule,
  [spotDifferenceModule.meta.key]: spotDifferenceModule,
  [sudokuModule.meta.key]: sudokuModule,
};

export function getPuzzleModule(
  typeKey: string,
  source: PuzzleRegistry = registry,
) {
  const puzzleModule = Object.hasOwn(source, typeKey)
    ? source[typeKey]
    : undefined;
  if (!puzzleModule) throw new Error(`Unknown puzzle type: ${typeKey}`);
  return puzzleModule;
}
