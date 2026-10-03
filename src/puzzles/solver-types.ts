import type { ReactNode } from "react";
import type { z } from "zod";
import type { PuzzleSchemas } from "./registry";

export type SolverProps<S extends PuzzleSchemas = PuzzleSchemas> = {
  payload: z.infer<S["payloadSchema"]>;
  initialState: z.infer<S["attemptSchema"]> | null;
  onStateChange(state: z.infer<S["attemptSchema"]>): void;
  /** The solver registers a function that returns its current answer, or null while it is incomplete. */
  registerCheck(read: () => z.infer<S["answerSchema"]> | null): void;
};

/** The method shorthand keeps the props bivariant, like the module methods in the registry. */
export type SolverComponent<S extends PuzzleSchemas = PuzzleSchemas> = {
  bivarianceHack(props: SolverProps<S>): ReactNode;
}["bivarianceHack"];
