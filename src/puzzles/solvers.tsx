"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { SolverProps } from "./solver-types";

type SolverModule = { Solver: ComponentType<SolverProps> };

/** Each solver is its own chunk, so a solve page ships only the solver it renders. */
const lazy = (load: () => Promise<SolverModule>) =>
  dynamic(() => load().then((module) => module.Solver));

/** Client solvers by type key. Only the solve chrome imports this; the registry and scripts must never reach it. */
export const solvers: Readonly<Record<string, ComponentType<SolverProps>>> = {
  __fixture: lazy(() => import("./__fixture/solver")),
  acrostic: lazy(() => import("./acrostic/solver")),
  anagram: lazy(() => import("./anagram/solver")),
  "book-cipher": lazy(() => import("./book-cipher/solver")),
  caesar: lazy(() => import("./caesar/solver")),
  "cctv-maze": lazy(() => import("./cctv-maze/solver")),
  crossword: lazy(() => import("./crossword/solver")),
  futoshiki: lazy(() => import("./futoshiki/solver")),
  "gear-train": lazy(() => import("./gear-train/solver")),
  gears: lazy(() => import("./gears/solver")),
  keyword: lazy(() => import("./keyword/solver")),
  "knights-knaves": lazy(() => import("./knights-knaves/solver")),
  "logic-grid": lazy(() => import("./logic-grid/solver")),
  "napkin-maths": lazy(() => import("./napkin-maths/solver")),
  "odd-one-out": lazy(() => import("./odd-one-out/solver")),
  "pictogram-cipher": lazy(() => import("./pictogram-cipher/solver")),
  "reverse-chess": lazy(() => import("./reverse-chess/solver")),
  rota: lazy(() => import("./rota/solver")),
  sightlines: lazy(() => import("./sightlines/solver")),
  "spot-difference": lazy(() => import("./spot-difference/solver")),
  sudoku: lazy(() => import("./sudoku/solver")),
  "word-ladder": lazy(() => import("./word-ladder/solver")),
  "word-search": lazy(() => import("./word-search/solver")),
};

export function getSolver(typeKey: string) {
  return Object.hasOwn(solvers, typeKey) ? solvers[typeKey] : null;
}

/** Types whose solver draws its own touch Check and Reset buttons through `requestCheck` and `requestReset`. */
export const ownsTouchControls = new Set(["reverse-chess"]);
