import type { ReactNode } from "react";
import type { z } from "zod";
import type { db } from "@/db";
import type { puzzleTypes } from "@/db/schema";
import { anagramModule } from "./anagram/module";
import { gearsModule } from "./gears/module";
import { reverseChessModule } from "./reverse-chess/module";
import { rotaModule } from "./rota/module";

export type Tx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

export type PuzzleSchemas = {
  payloadSchema: z.ZodType;
  answerSchema: z.ZodType;
  contentSchema: z.ZodType;
  attemptSchema: z.ZodType;
};

export type SolverProps<S extends PuzzleSchemas = PuzzleSchemas> = {
  payload: z.infer<S["payloadSchema"]>;
  initialState: z.infer<S["attemptSchema"]> | null;
  onStateChange(state: z.infer<S["attemptSchema"]>): void;
  /** The solver registers a function that returns its current answer, or null while it is incomplete. */
  registerCheck(read: () => z.infer<S["answerSchema"]> | null): void;
};

/** The method shorthand keeps the props bivariant, like the module methods below. */
export type SolverComponent<S extends PuzzleSchemas = PuzzleSchemas> = {
  bivarianceHack(props: SolverProps<S>): ReactNode;
}["bivarianceHack"];

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
  /** A `"use client"` component, or null until the type has a solver. */
  Solver: SolverComponent<S> | null;
  /** Writes the subtype and child rows for a puzzle whose supertype row already exists. */
  insertContent(
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
  /** Throws if the content is not uniquely solvable. */
  verify?(content: z.infer<S["contentSchema"]>): void;
};

export type PuzzleRegistry = Readonly<Record<string, PuzzleTypeModule>>;

export const registry: PuzzleRegistry = {
  [anagramModule.meta.key]: anagramModule,
  [gearsModule.meta.key]: gearsModule,
  [reverseChessModule.meta.key]: reverseChessModule,
  [rotaModule.meta.key]: rotaModule,
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
