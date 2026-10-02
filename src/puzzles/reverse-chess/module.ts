import type { PuzzleTypeModule } from "../registry";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  reverseChessPieces,
  reverseChessPuzzles,
  reverseChessSolutionPlies,
} from "./tables";

export const reverseChessModule = {
  schema,
  meta: { key: "reverse-chess" },
  load,
  loadSolution,
  check() {
    throw new Error("Reverse Chess checking is implemented in T029");
  },
  Solver() {
    return null;
  },
  async insertContent(tx, puzzleId, { pieces, solutionPlies, ...puzzle }) {
    await tx
      .insert(reverseChessPuzzles)
      .values({ ...puzzle, puzzleId, plyCount: solutionPlies.length });
    await tx
      .insert(reverseChessPieces)
      .values(pieces.map((piece) => ({ ...piece, puzzleId })));
    await tx.insert(reverseChessSolutionPlies).values(
      solutionPlies.map((ply, index) => ({
        ...ply,
        puzzleId,
        ply: index + 1,
      })),
    );
  },
} satisfies PuzzleTypeModule<typeof schema, schema.SolutionPly[]>;
