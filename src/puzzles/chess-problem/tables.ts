import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
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

export const chessProblemPuzzles = pgTable(
  "chess_problem_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'chess-problem'`),
    mateIn: smallint("mate_in").notNull(),
    whiteKingside: boolean("white_kingside").notNull(),
    whiteQueenside: boolean("white_queenside").notNull(),
    blackKingside: boolean("black_kingside").notNull(),
    blackQueenside: boolean("black_queenside").notNull(),
    enPassantFile: chessFileEnum("en_passant_file"),
  },
  (table) => [
    foreignKey({
      name: "chess_problem_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "chess_problem_puzzles_mate_in_check",
      sql`${table.mateIn} between 1 and 2`,
    ),
  ],
);

export const chessProblemPieces = pgTable(
  "chess_problem_pieces",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    file: chessFileEnum("file").notNull(),
    rank: smallint("rank").notNull(),
    colour: chessColourEnum("colour").notNull(),
    piece: chessPieceEnum("piece").notNull(),
  },
  (table) => [
    foreignKey({
      name: "chess_problem_pieces_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [chessProblemPuzzles.puzzleId],
    }).onDelete("cascade"),
    primaryKey({ columns: [table.puzzleId, table.file, table.rank] }),
    check(
      "chess_problem_pieces_rank_check",
      sql`${table.rank} between 1 and 8`,
    ),
  ],
);

export const chessProblemAttempts = pgTable(
  "chess_problem_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'chess-problem'`),
  },
  (table) => [
    foreignKey({
      name: "chess_problem_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const chessProblemAttemptPlies = pgTable(
  "chess_problem_attempt_plies",
  {
    attemptId: uuid("attempt_id").notNull(),
    ply: smallint("ply").notNull(),
    fromFile: chessFileEnum("from_file").notNull(),
    fromRank: smallint("from_rank").notNull(),
    toFile: chessFileEnum("to_file").notNull(),
    toRank: smallint("to_rank").notNull(),
    promotion: chessPieceEnum("promotion"),
  },
  (table) => [
    foreignKey({
      name: "chess_problem_attempt_plies_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [chessProblemAttempts.attemptId],
    }).onDelete("cascade"),
    primaryKey({ columns: [table.attemptId, table.ply] }),
    check(
      "chess_problem_attempt_plies_ply_check",
      sql`${table.ply} between 1 and 3`,
    ),
    check(
      "chess_problem_attempt_plies_from_rank_check",
      sql`${table.fromRank} between 1 and 8`,
    ),
    check(
      "chess_problem_attempt_plies_to_rank_check",
      sql`${table.toRank} between 1 and 8`,
    ),
  ],
);
