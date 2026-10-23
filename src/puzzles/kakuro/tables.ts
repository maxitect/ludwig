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

export const kakuroPuzzles = pgTable(
  "kakuro_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'kakuro'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "kakuro_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("kakuro_puzzles_rows_check", sql`${table.rows} between 5 and 14`),
    check("kakuro_puzzles_cols_check", sql`${table.cols} between 5 and 14`),
  ],
);

/** The white cells and their digits. Black cells are the absence of a row. */
export const kakuroCells = pgTable(
  "kakuro_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "kakuro_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "kakuro_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [kakuroPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("kakuro_cells_row_check", sql`${table.row} between 0 and 13`),
    check("kakuro_cells_col_check", sql`${table.col} between 0 and 13`),
    check("kakuro_cells_digit_check", sql`${table.digit} between 1 and 9`),
  ],
);

export const kakuroAttempts = pgTable(
  "kakuro_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'kakuro'`),
  },
  (table) => [
    foreignKey({
      name: "kakuro_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const kakuroAttemptCells = pgTable(
  "kakuro_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "kakuro_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "kakuro_attempt_cells_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [kakuroAttempts.attemptId],
    }).onDelete("cascade"),
    check("kakuro_attempt_cells_row_check", sql`${table.row} between 0 and 13`),
    check("kakuro_attempt_cells_col_check", sql`${table.col} between 0 and 13`),
    check(
      "kakuro_attempt_cells_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);
