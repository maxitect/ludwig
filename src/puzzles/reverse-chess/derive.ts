import { Chess, DEFAULT_POSITION } from "chess.js";
import type { Move } from "chess.js";
import type { Payload, PositionGoal } from "./schema";

export type Position = Pick<
  Payload,
  | "sideToMove"
  | "whiteKingside"
  | "whiteQueenside"
  | "blackKingside"
  | "blackQueenside"
  | "enPassantFile"
  | "halfmove"
  | "fullmove"
  | "pieces"
>;

type Piece = Payload["pieces"][number];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export const LETTER_BY_PIECE = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
} as const satisfies Record<Piece["piece"], string>;

const PIECE_BY_LETTER = Object.fromEntries(
  Object.entries(LETTER_BY_PIECE).map(([piece, letter]) => [letter, piece]),
) as Record<string, Piece["piece"]>;

/** Builds the FEN that chess.js loads from piece rows and scalar columns. Castling is always in `KQkq` order. */
export function toFen(position: Position) {
  const squares = new Map(
    position.pieces.map((piece) => [`${piece.file}${piece.rank}`, piece]),
  );

  const placement = [8, 7, 6, 5, 4, 3, 2, 1]
    .map((rank) => {
      let row = "";
      let empty = 0;
      for (const file of FILES) {
        const piece = squares.get(`${file}${rank}`);
        if (!piece) {
          empty += 1;
          continue;
        }
        if (empty) row += empty;
        empty = 0;
        const letter = LETTER_BY_PIECE[piece.piece];
        row += piece.colour === "white" ? letter.toUpperCase() : letter;
      }
      return row + (empty || "");
    })
    .join("/");

  const castling =
    [
      position.whiteKingside && "K",
      position.whiteQueenside && "Q",
      position.blackKingside && "k",
      position.blackQueenside && "q",
    ]
      .filter(Boolean)
      .join("") || "-";

  const enPassant = position.enPassantFile
    ? `${position.enPassantFile}${position.sideToMove === "white" ? 6 : 3}`
    : "-";

  return [
    placement,
    position.sideToMove === "white" ? "w" : "b",
    castling,
    enPassant,
    position.halfmove,
    position.fullmove,
  ].join(" ");
}

/** Inverse of `toFen`, for authoring and tests only. */
export function fromFen(fen: string): Position {
  const [placement, side, castling, enPassant, halfmove, fullmove] =
    fen.split(" ");

  const pieces = placement.split("/").flatMap((row, rowIndex) => {
    const found: Piece[] = [];
    let fileIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
        continue;
      }
      found.push({
        file: FILES[fileIndex],
        rank: 8 - rowIndex,
        colour: char === char.toUpperCase() ? "white" : "black",
        piece: PIECE_BY_LETTER[char.toLowerCase()],
      });
      fileIndex += 1;
    }
    return found;
  });

  return {
    sideToMove: side === "w" ? "white" : "black",
    whiteKingside: castling.includes("K"),
    whiteQueenside: castling.includes("Q"),
    blackKingside: castling.includes("k"),
    blackQueenside: castling.includes("q"),
    enPassantFile:
      enPassant === "-" ? null : (enPassant[0] as Position["enPassantFile"]),
    halfmove: Number(halfmove),
    fullmove: Number(fullmove),
    pieces,
  };
}

/** True when the position described by `fen` satisfies the Mode B goal. */
export function satisfiesGoal(fen: string, goal: PositionGoal) {
  const position = fromFen(fen);
  if (goal.kind === "piece_on_square") {
    return position.pieces.some(
      (piece) =>
        piece.file === goal.file &&
        piece.rank === goal.rank &&
        piece.colour === goal.colour &&
        piece.piece === goal.piece,
    );
  }
  if (goal.kind === "castling_right") {
    const rights = {
      white: {
        kingside: position.whiteKingside,
        queenside: position.whiteQueenside,
      },
      black: {
        kingside: position.blackKingside,
        queenside: position.blackQueenside,
      },
    };
    return rights[goal.colour][goal.side];
  }
  return (
    position.pieces.filter(
      (piece) => piece.colour === goal.colour && piece.piece === goal.piece,
    ).length === goal.count
  );
}

export type ForwardMove = Pick<Move, "from" | "to" | "promotion">;

/** The forward move that a retro move takes back: `position` is the one shown, with the promoted piece still on `to`. */
export function toForward(
  retro: Pick<Move, "from" | "to"> & { unpromote?: boolean },
  position: string,
): ForwardMove {
  return {
    from: retro.from,
    to: retro.to,
    promotion: retro.unpromote ? new Chess(position).get(retro.to)?.type : undefined,
  };
}

const fenKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

/** True when `moves`, legal from the standard starting position, end exactly at `fen`: placement, side to move, castling rights and en passant square. */
export function reproducesFromStart(moves: readonly ForwardMove[], fen: string) {
  const chess = new Chess();
  try {
    for (const move of moves) chess.move(move);
  } catch {
    return false;
  }
  return fenKey(chess.fen()) === fenKey(fen);
}

/** True when `fen` has the standard starting placement and White to move. */
export const isStartingPlacement = (fen: string) =>
  fen.split(" ").slice(0, 2).join(" ") ===
  DEFAULT_POSITION.split(" ").slice(0, 2).join(" ");

function forwardMove(prior: string, { from, to, promotion }: ForwardMove) {
  const moves = new Chess(prior).moves({ verbose: true });
  const found = moves.find(
    (move) =>
      move.from === from && move.to === to && move.promotion === promotion,
  );
  if (!found) throw new Error(`${from}${to} is not a legal move in ${prior}`);
  return { found, moves };
}

/** Standard algebraic notation of the forward move played from `prior`, without check or mate marks. */
export function toAlgebraic(move: ForwardMove, prior: string) {
  return forwardMove(prior, move).found.san.replace(/[+#]$/, "");
}

const DESCRIPTIVE_FILES = {
  a: "QR",
  b: "QN",
  c: "QB",
  d: "Q",
  e: "K",
  f: "KB",
  g: "KN",
  h: "KR",
} as const;

const descriptiveSquare = (square: string, colour: Move["color"]) =>
  `${DESCRIPTIVE_FILES[square[0] as keyof typeof DESCRIPTIVE_FILES]}${colour === "w" ? square[1] : 9 - Number(square[1])}`;

function descriptiveRest(move: Move) {
  const target = move.captured
    ? `x${move.captured.toUpperCase()}`
    : `-${descriptiveSquare(move.to, move.color)}`;
  const promotion = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  return `${target}${promotion}`;
}

/**
 * Descriptive notation of the forward move played from `prior`. Each side names squares from its own view:
 * files take the name of the piece that starts on them (QR, QN, QB, Q, K, KB, KN, KR) and ranks count from the mover's back rank.
 * Quiet moves read `N-KB3`, captures name the captured piece (`PxP`), promotions end `=Q`, castling is `O-O` or `O-O-O`.
 * When another legal move by the same kind of piece would read identically, the origin square follows the piece, as in `R(KR1)-Q1`.
 */
export function toDescriptive(move: ForwardMove, prior: string) {
  const { found, moves } = forwardMove(prior, move);
  if (found.isKingsideCastle()) return "O-O";
  if (found.isQueensideCastle()) return "O-O-O";

  const piece = found.piece.toUpperCase();
  const rest = descriptiveRest(found);
  const ambiguous = moves.some(
    (other) =>
      other !== found &&
      other.piece === found.piece &&
      descriptiveRest(other) === rest,
  );
  return ambiguous
    ? `${piece}(${descriptiveSquare(found.from, found.color)})${rest}`
    : `${piece}${rest}`;
}

const NOTATORS = { algebraic: toAlgebraic, descriptive: toDescriptive };

export type Notation = keyof typeof NOTATORS;

/** Notation of the forward move that a retro move takes back: `position` is the one shown, `prior` the one before the move. */
export function notateRetro(
  notation: Notation,
  retro: Pick<Move, "from" | "to"> & { unpromote?: boolean },
  position: string,
  prior: string,
) {
  return NOTATORS[notation](toForward(retro, position), prior);
}
