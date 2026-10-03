import { Chess } from "chess.js";
import type { Color, PieceSymbol, Square } from "chess.js";
import { LETTER_BY_PIECE } from "./derive";
import type { Content, SolutionPly } from "./schema";

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
  | "implausible_material"
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

const FILES = "abcdefgh";
const UNCAPTURE_CHOICES = ["q", "r", "b", "n", "p"] as const;
const KNIGHT_STEPS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const;
const ROOK_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
const BISHOP_STEPS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;
const MAX_PAWNS = 8;

type Steps = readonly (readonly [number, number])[];
type Origin = { from: Square; uncapture: "optional" | "required" | "never" };

const squareAt = (file: number, rank: number) =>
  file >= 0 && file < 8 && rank >= 1 && rank <= 8
    ? (`${FILES[file]}${rank}` as Square)
    : null;

/** Maps a DB-shaped solution ply to a `Retro`. This is the only place the two shapes meet. */
export function toRetro(ply: Content["solutionPlies"][number]): Retro {
  return {
    from: `${ply.fromFile}${ply.fromRank}` as Square,
    to: `${ply.toFile}${ply.toRank}` as Square,
    ...(ply.uncapture && { uncapture: LETTER_BY_PIECE[ply.uncapture] }),
    ...(ply.unpromote && { unpromote: true }),
    ...(ply.special !== "none" && { special: ply.special }),
  };
}

export const retroKey = ({ from, to, uncapture, unpromote, special }: Retro) =>
  [from, to, uncapture ?? "", unpromote ? "u" : "", special ?? ""].join(":");

function pawnOrigins(chess: Chess, to: Square, mover: Color): Origin[] {
  const forward = mover === "w" ? 1 : -1;
  const file = FILES.indexOf(to[0]);
  const rank = Number(to[1]);
  const origins: Origin[] = [];

  const back = squareAt(file, rank - forward);
  if (back && !chess.get(back)) {
    origins.push({ from: back, uncapture: "never" });
    const start = squareAt(file, rank - 2 * forward);
    if (rank === (mover === "w" ? 4 : 5) && start && !chess.get(start)) {
      origins.push({ from: start, uncapture: "never" });
    }
  }
  for (const side of [-1, 1]) {
    const diagonal = squareAt(file + side, rank - forward);
    if (diagonal && !chess.get(diagonal)) {
      origins.push({ from: diagonal, uncapture: "required" });
    }
  }
  return origins;
}

function steppedOrigins(
  chess: Chess,
  to: Square,
  steps: Steps,
  slide: boolean,
): Origin[] {
  const origins: Origin[] = [];
  const file = FILES.indexOf(to[0]);
  const rank = Number(to[1]);
  for (const [df, dr] of steps) {
    for (let n = 1; n < 8; n += 1) {
      const from = squareAt(file + df * n, rank + dr * n);
      if (!from || chess.get(from)) break;
      origins.push({ from, uncapture: "optional" });
      if (!slide) break;
    }
  }
  return origins;
}

function originsFor(chess: Chess, to: Square, type: PieceSymbol, mover: Color) {
  if (type === "n") return steppedOrigins(chess, to, KNIGHT_STEPS, false);
  if (type === "k") {
    return steppedOrigins(chess, to, [...ROOK_STEPS, ...BISHOP_STEPS], false);
  }
  if (type === "r") return steppedOrigins(chess, to, ROOK_STEPS, true);
  if (type === "b") return steppedOrigins(chess, to, BISHOP_STEPS, true);
  if (type === "q") {
    return steppedOrigins(chess, to, [...ROOK_STEPS, ...BISHOP_STEPS], true);
  }
  return pawnOrigins(chess, to, mover);
}

/**
 * Pawn count, back-rank pawns and promotion budget (bishop colour included) of `prior`.
 * Full reachability is not computed.
 */
function hasPlausibleMaterial(prior: string) {
  const chess = load(prior);
  if (!chess) return false;

  for (const colour of ["w", "b"] as const) {
    const count = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    const bishops = { light: 0, dark: 0 };
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell?.color !== colour) continue;
        count[cell.type] += 1;
        const { square } = cell;
        if (cell.type === "p" && (square[1] === "1" || square[1] === "8")) {
          return false;
        }
        if (cell.type === "b") {
          const parity = (FILES.indexOf(square[0]) + Number(square[1])) % 2;
          bishops[parity ? "light" : "dark"] += 1;
        }
      }
    }
    const promotions =
      Math.max(0, count.q - 1) +
      Math.max(0, count.r - 2) +
      Math.max(0, count.n - 2) +
      Math.max(0, bishops.light - 1) +
      Math.max(0, bishops.dark - 1);
    if (count.p > MAX_PAWNS || count.p + promotions > MAX_PAWNS) return false;
  }
  return true;
}

/** `applyRetro` plus the material rules that every enumerated retro move must also pass. */
export function stepRetro(
  position: string,
  retro: Retro,
): Result<{ prior: string }> {
  const result = applyRetro(position, retro);
  if (!result.ok) return result;
  return hasPlausibleMaterial(result.prior)
    ? result
    : { ok: false, reason: "implausible_material" };
}

/** Every retro move that `stepRetro` accepts for `position`. */
export function enumerateRetro(position: string): Retro[] {
  const chess = load(position);
  if (!chess) return [];

  const mover = other(chess.turn());
  const promotionRank = backRank(other(mover));
  const enPassantRank = mover === "w" ? "6" : "3";
  const candidates: Retro[] = [];

  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell?.color !== mover) continue;
      const { square: to, type } = cell;
      const shapes: { unpromote: boolean; type: PieceSymbol }[] = [
        { unpromote: false, type },
      ];
      if (type !== "p" && type !== "k" && to[1] === promotionRank) {
        shapes.push({ unpromote: true, type: "p" });
      }

      for (const shape of shapes) {
        for (const { from, uncapture } of originsFor(
          chess,
          to,
          shape.type,
          mover,
        )) {
          const unpromote = shape.unpromote || undefined;
          const choices =
            uncapture === "never"
              ? [undefined]
              : uncapture === "required"
                ? UNCAPTURE_CHOICES
                : [undefined, ...UNCAPTURE_CHOICES];
          for (const choice of choices) {
            candidates.push({ from, to, uncapture: choice, unpromote });
          }
          if (
            shape.type === "p" &&
            !shape.unpromote &&
            uncapture === "required" &&
            to[1] === enPassantRank
          ) {
            candidates.push({ from, to, special: "en_passant" });
          }
        }
      }

      const rank = backRank(mover);
      if (type === "k" && (to === `g${rank}` || to === `c${rank}`)) {
        candidates.push({ from: `e${rank}` as Square, to, special: "castle" });
      }
    }
  }

  return candidates
    .filter((retro) => stepRetro(position, retro).ok)
    .map(({ from, to, uncapture, unpromote, special }) => ({
      from,
      to,
      ...(uncapture && { uncapture }),
      ...(unpromote && { unpromote }),
      ...(special && { special }),
    }));
}
