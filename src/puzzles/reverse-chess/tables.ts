import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import {
  chessColourEnum,
  chessFileEnum,
  chessPieceEnum,
  puzzles,
} from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const retroModeEnum = pgEnum("retro_mode", ["last_move", "unwind"]);
export const retroSpecialEnum = pgEnum("retro_special", [
  "none",
  "en_passant",
  "castle",
]);

export const reverseChessPuzzles = pgTable(
  "reverse_chess_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'reverse-chess'`),
    mode: retroModeEnum("mode").notNull(),
    sideToMove: chessColourEnum("side_to_move").notNull(),
    whiteKingside: boolean("white_kingside").notNull(),
    whiteQueenside: boolean("white_queenside").notNull(),
    blackKingside: boolean("black_kingside").notNull(),
    blackQueenside: boolean("black_queenside").notNull(),
    enPassantFile: chessFileEnum("en_passant_file"),
    halfmove: smallint("halfmove").notNull(),
    fullmove: smallint("fullmove").notNull(),
    goalText: text("goal_text"),
    plyCount: smallint("ply_count").notNull(),
  },
  (table) => [
    foreignKey({
      name: "reverse_chess_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("reverse_chess_puzzles_halfmove_check", sql`${table.halfmove} >= 0`),
    check("reverse_chess_puzzles_fullmove_check", sql`${table.fullmove} >= 1`),
    check("reverse_chess_puzzles_ply_count_check", sql`${table.plyCount} >= 1`),
  ],
);

export const reverseChessPieces = pgTable(
  "reverse_chess_pieces",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    file: chessFileEnum("file").notNull(),
    rank: smallint("rank").notNull(),
    colour: chessColourEnum("colour").notNull(),
    piece: chessPieceEnum("piece").notNull(),
  },
  (table) => [
    foreignKey({
      name: "reverse_chess_pieces_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [reverseChessPuzzles.puzzleId],
    }).onDelete("cascade"),
    primaryKey({ columns: [table.puzzleId, table.file, table.rank] }),
    check("reverse_chess_pieces_rank_check", sql`${table.rank} between 1 and 8`),
  ],
);

export const reverseChessSolutionPlies = pgTable(
  "reverse_chess_solution_plies",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    ply: smallint("ply").notNull(),
    fromFile: chessFileEnum("from_file").notNull(),
    fromRank: smallint("from_rank").notNull(),
    toFile: chessFileEnum("to_file").notNull(),
    toRank: smallint("to_rank").notNull(),
    uncapture: chessPieceEnum("uncapture"),
    unpromote: boolean("unpromote").notNull(),
    special: retroSpecialEnum("special").notNull(),
  },
  (table) => [
    foreignKey({
      name: "reverse_chess_solution_plies_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [reverseChessPuzzles.puzzleId],
    }).onDelete("cascade"),
    primaryKey({ columns: [table.puzzleId, table.ply] }),
    check("reverse_chess_solution_plies_ply_check", sql`${table.ply} >= 1`),
    check(
      "reverse_chess_solution_plies_from_rank_check",
      sql`${table.fromRank} between 1 and 8`,
    ),
    check(
      "reverse_chess_solution_plies_to_rank_check",
      sql`${table.toRank} between 1 and 8`,
    ),
  ],
);

export const reverseChessAttempts = pgTable(
  "reverse_chess_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'reverse-chess'`),
  },
  (table) => [
    foreignKey({
      name: "reverse_chess_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const reverseChessAttemptPlies = pgTable(
  "reverse_chess_attempt_plies",
  {
    attemptId: uuid("attempt_id").notNull(),
    ply: smallint("ply").notNull(),
    fromFile: chessFileEnum("from_file").notNull(),
    fromRank: smallint("from_rank").notNull(),
    toFile: chessFileEnum("to_file").notNull(),
    toRank: smallint("to_rank").notNull(),
    uncapture: chessPieceEnum("uncapture"),
    unpromote: boolean("unpromote").notNull(),
    special: retroSpecialEnum("special").notNull(),
  },
  (table) => [
    foreignKey({
      name: "reverse_chess_attempt_plies_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [reverseChessAttempts.attemptId],
    }).onDelete("cascade"),
    primaryKey({ columns: [table.attemptId, table.ply] }),
    check("reverse_chess_attempt_plies_ply_check", sql`${table.ply} >= 1`),
    check(
      "reverse_chess_attempt_plies_from_rank_check",
      sql`${table.fromRank} between 1 and 8`,
    ),
    check(
      "reverse_chess_attempt_plies_to_rank_check",
      sql`${table.toRank} between 1 and 8`,
    ),
  ],
);
