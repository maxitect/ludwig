import { sql } from "drizzle-orm";
import {
  char,
  check,
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const crosswordStyleEnum = pgEnum("crossword_style", [
  "cryptic",
  "quick",
]);
export const clueDirectionEnum = pgEnum("clue_direction", ["across", "down"]);
export const segmentSeparatorEnum = pgEnum("segment_separator", [
  "word",
  "hyphen",
]);

export const crosswordPuzzles = pgTable(
  "crossword_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'crossword'`),
    style: crosswordStyleEnum("style").notNull(),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "crossword_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("crossword_puzzles_rows_check", sql`${table.rows} between 2 and 21`),
    check("crossword_puzzles_cols_check", sql`${table.cols} between 2 and 21`),
  ],
);

export const crosswordCells = pgTable(
  "crossword_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    letter: char("letter", { length: 1 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "crossword_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "crossword_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [crosswordPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("crossword_cells_row_check", sql`${table.row} >= 0`),
    check("crossword_cells_col_check", sql`${table.col} >= 0`),
    check("crossword_cells_letter_check", sql`${table.letter} ~ '^[A-Z]$'`),
  ],
);

export const crosswordClues = pgTable(
  "crossword_clues",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    direction: clueDirectionEnum("direction").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    clueText: text("clue_text").notNull(),
  },
  (table) => [
    primaryKey({
      name: "crossword_clues_pkey",
      columns: [table.puzzleId, table.direction, table.row, table.col],
    }),
    foreignKey({
      name: "crossword_clues_start_cell_fk",
      columns: [table.puzzleId, table.row, table.col],
      foreignColumns: [
        crosswordCells.puzzleId,
        crosswordCells.row,
        crosswordCells.col,
      ],
    }).onDelete("cascade"),
  ],
);

export const crosswordClueSegments = pgTable(
  "crossword_clue_segments",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    direction: clueDirectionEnum("direction").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    position: smallint("position").notNull(),
    length: smallint("length").notNull(),
    separator: segmentSeparatorEnum("separator"),
  },
  (table) => [
    primaryKey({
      name: "crossword_clue_segments_pkey",
      columns: [
        table.puzzleId,
        table.direction,
        table.row,
        table.col,
        table.position,
      ],
    }),
    foreignKey({
      name: "crossword_clue_segments_clue_fk",
      columns: [table.puzzleId, table.direction, table.row, table.col],
      foreignColumns: [
        crosswordClues.puzzleId,
        crosswordClues.direction,
        crosswordClues.row,
        crosswordClues.col,
      ],
    }).onDelete("cascade"),
    check(
      "crossword_clue_segments_position_check",
      sql`${table.position} >= 0`,
    ),
    check("crossword_clue_segments_length_check", sql`${table.length} >= 1`),
  ],
);

export const crosswordAttempts = pgTable(
  "crossword_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'crossword'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "crossword_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("crossword_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const crosswordAttemptCells = pgTable(
  "crossword_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    letter: char("letter", { length: 1 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "crossword_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "crossword_attempt_cells_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [crosswordAttempts.attemptId, crosswordAttempts.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "crossword_attempt_cells_cell_fk",
      columns: [table.puzzleId, table.row, table.col],
      foreignColumns: [
        crosswordCells.puzzleId,
        crosswordCells.row,
        crosswordCells.col,
      ],
    }),
    check(
      "crossword_attempt_cells_letter_check",
      sql`${table.letter} ~ '^[A-Z]$'`,
    ),
  ],
);
