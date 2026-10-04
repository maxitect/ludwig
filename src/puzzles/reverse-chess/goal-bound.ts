import { LETTER_BY_PIECE, fromFen, type Position } from "./derive";
import { materialPlausible } from "./engine";
import type { Goal } from "./schema";

type Colour = Position["pieces"][number]["colour"];
type Kind = Position["pieces"][number]["piece"];
type Coords = readonly [file: number, rank: number];

const FILES = "abcdefgh";
const MAX_PAWNS = 8;

const opposite = (colour: Colour): Colour =>
  colour === "white" ? "black" : "white";

/** Fewest retro moves in which `events` moves by `colour` can happen, when `first` moves first and the sides alternate. */
const stepsFor = (events: number, colour: Colour, first: Colour) => {
  if (events === 0) return 0;
  return first === colour ? 2 * events - 1 : 2 * events;
};

/** Never more than the moves the piece itself needs to go from one square to another, so it may undercount. */
function distance(kind: Kind, colour: Colour, from: Coords, to: Coords) {
  const files = Math.abs(from[0] - to[0]);
  const ranks = Math.abs(from[1] - to[1]);
  if (!files && !ranks) return 0;
  if (kind === "knight") {
    return Math.max(
      Math.ceil(Math.max(files, ranks) / 2),
      Math.ceil((files + ranks) / 3),
    );
  }
  if (kind === "bishop") {
    if ((files + ranks) % 2) return Infinity;
    return files === ranks ? 1 : 2;
  }
  if (kind === "rook") return !files || !ranks ? 1 : 2;
  if (kind === "queen") return !files || !ranks || files === ranks ? 1 : 2;
  if (kind === "king") return Math.max(files, ranks);
  const back = colour === "white" ? from[1] - to[1] : to[1] - from[1];
  return back > 0 ? Math.max(files, Math.ceil(back / 2)) : Infinity;
}

const coords = (file: string, rank: number): Coords => [
  FILES.indexOf(file),
  rank,
];

function countBound(
  position: Position,
  goal: Extract<Goal, { kind: "piece_count" }>,
  first: Colour,
) {
  const current = position.pieces.filter(
    ({ colour, piece }) => colour === goal.colour && piece === goal.piece,
  ).length;
  const gap = Math.abs(goal.count - current);
  if (!gap) return 0;
  if (goal.piece === "king") return Infinity;
  if (goal.count > current) {
    return goal.piece === "pawn"
      ? gap
      : stepsFor(gap, opposite(goal.colour), first);
  }
  return goal.piece === "pawn" ? Infinity : stepsFor(gap, goal.colour, first);
}

function castlingBound(
  position: Position,
  goal: Extract<Goal, { kind: "castling_right" }>,
  first: Colour,
) {
  const rights = {
    white: { kingside: position.whiteKingside, queenside: position.whiteQueenside },
    black: { kingside: position.blackKingside, queenside: position.blackQueenside },
  };
  if (rights[goal.colour][goal.side]) return 0;
  const king = position.pieces.find(
    ({ colour, piece }) => colour === goal.colour && piece === "king",
  );
  if (!king) return Infinity;
  const rank = goal.colour === "white" ? 1 : 8;
  const castled = coords(goal.side === "kingside" ? "g" : "c", rank);
  const walk = distance("king", goal.colour, coords(king.file, king.rank), castled);
  return stepsFor(1 + walk, goal.colour, first);
}

/** Whether the position could host one more `colour` `kind` on `square`. Material never frees up in retro play, so a no now is a no later. */
function canGain(
  position: Position,
  colour: Colour,
  kind: Kind,
  file: string,
  rank: number,
) {
  const cells = [...position.pieces, { colour, piece: kind, file, rank }].map(
    (cell) => ({
      color: cell.colour === "white" ? ("w" as const) : ("b" as const),
      type: LETTER_BY_PIECE[cell.piece],
      square: `${cell.file}${cell.rank}` as const,
    }),
  );
  return materialPlausible(cells);
}

function squareBound(
  position: Position,
  goal: Extract<Goal, { kind: "piece_on_square" }>,
  first: Colour,
) {
  const { colour, piece, file, rank } = goal;
  const target = coords(file, rank);
  const own = position.pieces.filter(
    (found) => found.colour === colour && found.piece === piece,
  );
  if (own.some((found) => found.file === file && found.rank === rank)) return 0;

  const routes = own.map((found) =>
    stepsFor(
      distance(piece, colour, coords(found.file, found.rank), target),
      colour,
      first,
    ),
  );
  if (piece !== "king" && canGain(position, colour, piece, file, rank)) {
    routes.push(stepsFor(1, opposite(colour), first));
  }
  const pawns = own.length;
  if (piece === "pawn" && pawns < MAX_PAWNS) {
    routes.push(stepsFor(1, colour, first));
  }
  return Math.min(Infinity, ...routes);
}

/**
 * A lower bound on the retro moves needed before `fen` can meet `goal`: it is never more than the true number,
 * so a position whose bound exceeds the moves left can be dropped without losing a chain.
 */
export function minRetroMoves(fen: string, goal: Goal) {
  const position = fromFen(fen);
  const first = opposite(position.sideToMove);
  if (goal.kind === "piece_count") return countBound(position, goal, first);
  if (goal.kind === "castling_right") {
    return castlingBound(position, goal, first);
  }
  return squareBound(position, goal, first);
}
