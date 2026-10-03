import type { ReactNode } from "react";
import type { z } from "zod";
import type { PuzzleSchemas } from "./registry";

export type SolverProps<S extends PuzzleSchemas = PuzzleSchemas> = {
  payload: z.infer<S["payloadSchema"]>;
  initialState: z.infer<S["attemptSchema"]> | null;
  onStateChange(state: z.infer<S["attemptSchema"]>): void;
  /** The solver registers a function that returns its current answer, or null while it is incomplete. */
  registerCheck(read: () => z.infer<S["answerSchema"]> | null): void;
  /** Checks one cell on the server and records the hint. Null when the player is signed out or the call failed. */
  checkCell?(row: number, col: number, value: string): Promise<boolean | null>;
  /** Reveals one cell's value from the server and records the hint. Null when signed out or the call failed. */
  revealCell?(row: number, col: number): Promise<string | null>;
};

/** The method shorthand keeps the props bivariant, like the module methods in the registry. */
export type SolverComponent<S extends PuzzleSchemas = PuzzleSchemas> = {
  bivarianceHack(props: SolverProps<S>): ReactNode;
}["bivarianceHack"];
