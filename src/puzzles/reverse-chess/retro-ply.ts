import type { RetroDrop, UncaptureChoice } from "../_shared/chess-board";
import { fromFen } from "./derive";
import type { RetroRejection } from "./engine";
import type * as schema from "./schema";

export type Ply = schema.Answer["plies"][number];

/** A retro move as the player is building it, before special moves are inferred. */
export type Draft = {
  from: RetroDrop["from"];
  to: RetroDrop["to"];
  uncapture: UncaptureChoice;
  unpromote: boolean;
  enPassant: boolean;
};

export const REJECTION_TEXT: Record<RetroRejection, string> = {
  no_piece_on_to: "There is no piece there to move back.",
  wrong_side:
    "That piece belongs to the side to move, so it cannot have moved last.",
  origin_occupied: "Another piece is already standing on that square.",
  non_moving_side_in_check:
    "That would leave the side to move in check before the last move, which cannot happen.",
  illegal_uncapture: "That piece cannot have been captured there.",
  illegal_unpromote: "That piece cannot have been promoted there.",
  replay_mismatch: "That move could not have led to this position.",
  implausible_material:
    "That would need more pieces than either side could have had.",
  invalid_fen: "That position is not valid.",
};

export const DROP_VARIANTS = (["none", "queen", "rook", "bishop", "knight", "pawn"] as const).flatMap(
  (uncapture) =>
    [false, true].flatMap((unpromote) =>
      [false, true].map((enPassant) => ({ uncapture, unpromote, enPassant })),
    ),
);

/** A king landing two files from the king's home square can only have castled, so castling needs no control. */
function isCastle({ from, to }: Draft, isKing: boolean) {
  return (
    isKing &&
    from[0] === "e" &&
    from[1] === to[1] &&
    Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2
  );
}

export function toPly(draft: Draft, isKing: boolean): Ply {
  const { from, to, uncapture, unpromote, enPassant } = draft;
  const castle = isCastle(draft, isKing);
  return {
    fromFile: from[0] as Ply["fromFile"],
    fromRank: Number(from[1]),
    toFile: to[0] as Ply["toFile"],
    toRank: Number(to[1]),
    uncapture: castle || enPassant || uncapture === "none" ? null : uncapture,
    unpromote: castle ? false : unpromote,
    special: castle ? "castle" : enPassant ? "en_passant" : "none",
  };
}

export const toDraft = (ply: Ply): Draft => ({
  from: `${ply.fromFile}${ply.fromRank}`,
  to: `${ply.toFile}${ply.toRank}`,
  uncapture: ply.uncapture === "king" ? "none" : (ply.uncapture ?? "none"),
  unpromote: ply.unpromote,
  enPassant: ply.special === "en_passant",
});

export function isKingAt(fen: string, square: Draft["to"]) {
  return fromFen(fen).pieces.some(
    (piece) =>
      `${piece.file}${piece.rank}` === square && piece.piece === "king",
  );
}
