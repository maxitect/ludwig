import { Chess } from "chess.js";
import type { Color, PieceSymbol, Square } from "chess.js";
import type { SolutionPly } from "./schema";

export type Retro = {
  from: Square;
  to: Square;
  uncapture?: PieceSymbol;
  unpromote?: boolean;
  special?: Exclude<SolutionPly["special"], "none">;
};

export type RetroRejection =
  | "no_piece_on_to"
  | "wrong_side"
  | "origin_occupied"
  | "non_moving_side_in_check"
  | "illegal_uncapture"
  | "illegal_unpromote"
  | "replay_mismatch"
  | "invalid_fen";

type Result<T> = ({ ok: true } & T) | { ok: false; reason: RetroRejection };

const COMPARED_FEN_FIELDS = 4;

function load(fen: string) {
  try {
    return new Chess(fen);
  } catch {
    return null;
  }
}

const other = (colour: Color): Color => (colour === "w" ? "b" : "w");
const backRank = (colour: Color) => (colour === "w" ? "1" : "8");
const fenKey = (fen: string) =>
  fen.split(" ").slice(0, COMPARED_FEN_FIELDS).join(" ");

/** Builds the position before `retro`, or says why `retro` cannot have been the last move. */
function buildPrior(position: string, retro: Retro): Result<{ prior: string }> {
  const chess = load(position);
  if (!chess) return { ok: false, reason: "invalid_fen" };

  const [, , castling, , , fullmoveField] = position.split(" ");
  const mover = other(chess.turn());
  const { from, to, uncapture, unpromote, special } = retro;
  const onTo = chess.get(to);

  if (!onTo) return { ok: false, reason: "no_piece_on_to" };
  if (onTo.color !== mover) return { ok: false, reason: "wrong_side" };
  if (chess.get(from)) return { ok: false, reason: "origin_occupied" };

  if (uncapture) {
    const onBackRank = to[1] === "1" || to[1] === "8";
    if (
      uncapture === "k" ||
      special === "en_passant" ||
      (uncapture === "p" && onBackRank)
    ) {
      return { ok: false, reason: "illegal_uncapture" };
    }
  }

  if (unpromote) {
    const promoted = onTo.type !== "p" && onTo.type !== "k";
    if (!promoted || to[1] !== backRank(other(mover))) {
      return { ok: false, reason: "illegal_unpromote" };
    }
  }

  let enPassant = "-";
  let priorCastling = castling;
  chess.remove(to);
  chess.put({ type: unpromote ? "p" : onTo.type, color: mover }, from);

  if (uncapture) chess.put({ type: uncapture, color: other(mover) }, to);

  if (special === "en_passant") {
    const captured = `${to[0]}${from[1]}` as Square;
    if (chess.get(captured)) return { ok: false, reason: "origin_occupied" };
    chess.put({ type: "p", color: other(mover) }, captured);
    enPassant = to;
  }

  if (special === "castle") {
    const kingside = to[0] === "g";
    const rank = backRank(mover);
    const rookNow = `${kingside ? "f" : "d"}${rank}` as Square;
    const rookHome = `${kingside ? "h" : "a"}${rank}` as Square;
    const rook = chess.get(rookNow);
    if (onTo.type !== "k" || from !== `e${rank}` || rook?.type !== "r") {
      return { ok: false, reason: "replay_mismatch" };
    }
    if (chess.get(rookHome)) return { ok: false, reason: "origin_occupied" };
    chess.remove(rookNow);
    chess.put(rook, rookHome);
    const right = kingside ? "K" : "Q";
    const added = mover === "w" ? right : right.toLowerCase();
    priorCastling = [...(castling === "-" ? "" : castling), added]
      .sort((a, b) => "KQkq".indexOf(a) - "KQkq".indexOf(b))
      .join("");
  }

  const [placement] = chess.fen().split(" ");
  const fullmove = Number(fullmoveField) - (mover === "b" ? 1 : 0);
  return {
    ok: true,
    prior: [
      placement,
      mover,
      priorCastling,
      enPassant,
      0,
      Math.max(1, fullmove),
    ].join(" "),
  };
}

/** The side that did not just move (the one not to move in `prior`) must not be in check. */
export function validatePrior(prior: string): Result<unknown> {
  const chess = load(prior);
  if (!chess) return { ok: false, reason: "invalid_fen" };

  const fields = prior.split(" ");
  fields[1] = other(chess.turn());
  fields[3] = "-";
  const flipped = load(fields.join(" "));
  if (!flipped) return { ok: false, reason: "invalid_fen" };
  if (flipped.isCheck()) {
    return { ok: false, reason: "non_moving_side_in_check" };
  }
  return { ok: true };
}

/** Plays `retro` forward from `prior` and compares placement, side to move, castling and en passant with `position`. */
export function replayMatches(prior: string, retro: Retro, position: string) {
  const chess = load(prior);
  const target = load(position);
  if (!chess || !target) return false;

  const promotion = retro.unpromote ? target.get(retro.to)?.type : undefined;
  try {
    chess.move({ from: retro.from, to: retro.to, promotion });
  } catch {
    return false;
  }

  return fenKey(chess.fen()) === fenKey(target.fen());
}

export function applyRetro(
  position: string,
  retro: Retro,
): Result<{ prior: string }> {
  const built = buildPrior(position, retro);
  if (!built.ok) return built;

  const valid = validatePrior(built.prior);
  if (!valid.ok) return valid;

  if (!replayMatches(built.prior, retro, position)) {
    return { ok: false, reason: "replay_mismatch" };
  }
  return built;
}
