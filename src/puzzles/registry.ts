import type { ReactNode } from "react";
import type { z } from "zod";
import type { db } from "@/db";
import type { puzzleTypes } from "@/db/schema";
import { reverseChessModule } from "./reverse-chess/module";

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
  ): { correct: boolean };
  Solver(props: { payload: z.infer<S["payloadSchema"]> }): ReactNode;
  /** Writes the subtype and child rows for a puzzle whose supertype row already exists. */
  insertContent(
    tx: Tx,
    puzzleId: string,
    content: z.infer<S["contentSchema"]>,
  ): Promise<void>;
  /** Throws if the content is not uniquely solvable. */
  verify?(content: z.infer<S["contentSchema"]>): void;
};

export type PuzzleRegistry = Readonly<Record<string, PuzzleTypeModule>>;

export const registry: PuzzleRegistry = {
  [reverseChessModule.meta.key]: reverseChessModule,
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
