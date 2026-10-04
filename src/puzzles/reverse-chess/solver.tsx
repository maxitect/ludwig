"use client";

import type { SolverProps } from "../solver-types";
import { LastMove } from "./last-move";
import type * as schema from "./schema";
import { Unwind } from "./unwind";

export function Solver(props: SolverProps<typeof schema>) {
  return props.payload.mode === "last_move" ? (
    <LastMove {...props} />
  ) : (
    <Unwind {...props} />
  );
}
