import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const sudokuPuzzles = pgTable(
  "sudoku_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'sudoku'`),
  },
  (table) => [
    foreignKey({
      name: "sudoku_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const sudokuGivens = pgTable(
  "sudoku_givens",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_givens_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "sudoku_givens_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("sudoku_givens_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_givens_col_check", sql`${table.col} between 0 and 8`),
    check("sudoku_givens_digit_check", sql`${table.digit} between 1 and 9`),
  ],
);

export const sudokuAttempts = pgTable(
  "sudoku_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'sudoku'`),
  },
  (table) => [
    foreignKey({
      name: "sudoku_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const sudokuAttemptCells = pgTable(
  "sudoku_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "sudoku_attempt_cells_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [sudokuAttempts.attemptId],
    }).onDelete("cascade"),
    check("sudoku_attempt_cells_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_attempt_cells_col_check", sql`${table.col} between 0 and 8`),
    check(
      "sudoku_attempt_cells_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);

export const sudokuAttemptNotes = pgTable(
  "sudoku_attempt_notes",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_attempt_notes_pkey",
      columns: [table.attemptId, table.row, table.col, table.digit],
    }),
    foreignKey({
      name: "sudoku_attempt_notes_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [sudokuAttempts.attemptId],
    }).onDelete("cascade"),
    check("sudoku_attempt_notes_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_attempt_notes_col_check", sql`${table.col} between 0 and 8`),
    check(
      "sudoku_attempt_notes_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);
