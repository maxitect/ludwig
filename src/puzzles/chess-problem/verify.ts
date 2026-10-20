import { Chess } from "chess.js";
import { toFen } from "./derive";
import { keyMoves } from "./engine";
import type { Content } from "./schema";

/** Throws unless the position is legal, has no mate in fewer moves than `mateIn`, and has exactly one key move. */
export function verifyChessProblem(content: Content) {
  const fen = toFen(content);
  const { pieces, mateIn } = content;

  if (pieces.some(({ piece, rank }) => piece === "pawn" && (rank === 1 || rank === 8))) {
    throw new Error("a pawn stands on the first or last rank");
  }
  try {
    new Chess(fen);
  } catch (error) {
    throw new Error(`illegal position: ${(error as Error).message}`);
  }
  if (new Chess(fen.replace(" w ", " b ")).isCheck()) {
    throw new Error("illegal position: Black is in check with White to move");
  }

  for (let shorter = 1; shorter < mateIn; shorter++) {
    const quicker = keyMoves(fen, shorter);
    if (quicker.length > 0) {
      throw new Error(
        `White mates in ${shorter} (${quicker.map((move) => move.san).join(", ")}), not in ${mateIn}`,
      );
    }
  }
  const keys = keyMoves(fen, mateIn);
  if (keys.length !== 1) {
    throw new Error(
      `expected exactly 1 key move, found ${keys.length}${keys.length ? `: ${keys.map((move) => move.san).join(", ")}` : ""}`,
    );
  }
}
