import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";
import { compass8Enum } from "../sightlines/tables";

/** The sides a piece joins: `ns` is straight up and down, `ne` curves between north and east. */
export const trackPieceEnum = pgEnum("track_piece", [
  "ns",
  "ew",
  "ne",
  "nw",
  "se",
  "sw",
]);

export const railroadPuzzles = pgTable(
  "railroad_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'railroad'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
    entryRow: smallint("entry_row").notNull(),
    entryCol: smallint("entry_col").notNull(),
    entrySide: compass8Enum("entry_side").notNull(),
    exitRow: smallint("exit_row").notNull(),
    exitCol: smallint("exit_col").notNull(),
    exitSide: compass8Enum("exit_side").notNull(),
  },
  (table) => [
    foreignKey({
      name: "railroad_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("railroad_puzzles_rows_check", sql`${table.rows} between 4 and 10`),
    check("railroad_puzzles_cols_check", sql`${table.cols} between 4 and 10`),
    check(
      "railroad_puzzles_entry_row_check",
      sql`${table.entryRow} between 0 and ${table.rows} - 1`,
    ),
    check(
      "railroad_puzzles_entry_col_check",
      sql`${table.entryCol} between 0 and ${table.cols} - 1`,
    ),
    check(
      "railroad_puzzles_exit_row_check",
      sql`${table.exitRow} between 0 and ${table.rows} - 1`,
    ),
    check(
      "railroad_puzzles_exit_col_check",
      sql`${table.exitCol} between 0 and ${table.cols} - 1`,
    ),
    check(
      "railroad_puzzles_entry_side_check",
      sql`${table.entrySide} in ('n', 'e', 's', 'w')`,
    ),
    check(
      "railroad_puzzles_exit_side_check",
      sql`${table.exitSide} in ('n', 'e', 's', 'w')`,
    ),
  ],
);

/** A clue: how many track cells the row holds. */
export const railroadRowCounts = pgTable(
  "railroad_row_counts",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    count: smallint("count").notNull(),
  },
  (table) => [
    primaryKey({
      name: "railroad_row_counts_pkey",
      columns: [table.puzzleId, table.row],
    }),
    foreignKey({
      name: "railroad_row_counts_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [railroadPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("railroad_row_counts_row_check", sql`${table.row} between 0 and 9`),
    check(
      "railroad_row_counts_count_check",
      sql`${table.count} between 0 and 10`,
    ),
  ],
);

/** A clue: how many track cells the column holds. */
export const railroadColCounts = pgTable(
  "railroad_col_counts",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    col: smallint("col").notNull(),
    count: smallint("count").notNull(),
  },
  (table) => [
    primaryKey({
      name: "railroad_col_counts_pkey",
      columns: [table.puzzleId, table.col],
    }),
    foreignKey({
      name: "railroad_col_counts_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [railroadPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("railroad_col_counts_col_check", sql`${table.col} between 0 and 9`),
    check(
      "railroad_col_counts_count_check",
      sql`${table.count} between 0 and 10`,
    ),
  ],
);

/** A piece the puzzle lays for the player. */
export const railroadGivenPieces = pgTable(
  "railroad_given_pieces",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    piece: trackPieceEnum("piece").notNull(),
  },
  (table) => [
    primaryKey({
      name: "railroad_given_pieces_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "railroad_given_pieces_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [railroadPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("railroad_given_pieces_row_check", sql`${table.row} between 0 and 9`),
    check("railroad_given_pieces_col_check", sql`${table.col} between 0 and 9`),
  ],
);

export const railroadAttempts = pgTable(
  "railroad_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'railroad'`),
  },
  (table) => [
    foreignKey({
      name: "railroad_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const railroadAttemptPieces = pgTable(
  "railroad_attempt_pieces",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    piece: trackPieceEnum("piece").notNull(),
  },
  (table) => [
    primaryKey({
      name: "railroad_attempt_pieces_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "railroad_attempt_pieces_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [railroadAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "railroad_attempt_pieces_row_check",
      sql`${table.row} between 0 and 9`,
    ),
    check(
      "railroad_attempt_pieces_col_check",
      sql`${table.col} between 0 and 9`,
    ),
  ],
);

/** A cell the player marked as having no track. */
export const railroadAttemptCrosses = pgTable(
  "railroad_attempt_crosses",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "railroad_attempt_crosses_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "railroad_attempt_crosses_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [railroadAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "railroad_attempt_crosses_row_check",
      sql`${table.row} between 0 and 9`,
    ),
    check(
      "railroad_attempt_crosses_col_check",
      sql`${table.col} between 0 and 9`,
    ),
  ],
);
