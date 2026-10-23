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

export const fillominoPuzzles = pgTable(
  "fillomino_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'fillomino'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "fillomino_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("fillomino_puzzles_rows_check", sql`${table.rows} between 5 and 12`),
    check("fillomino_puzzles_cols_check", sql`${table.cols} between 5 and 12`),
  ],
);

export const fillominoGivens = pgTable(
  "fillomino_givens",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "fillomino_givens_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "fillomino_givens_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [fillominoPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("fillomino_givens_row_check", sql`${table.row} between 0 and 11`),
    check("fillomino_givens_col_check", sql`${table.col} between 0 and 11`),
    check("fillomino_givens_digit_check", sql`${table.digit} between 1 and 9`),
  ],
);

export const fillominoAttempts = pgTable(
  "fillomino_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'fillomino'`),
  },
  (table) => [
    foreignKey({
      name: "fillomino_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const fillominoAttemptCells = pgTable(
  "fillomino_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "fillomino_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "fillomino_attempt_cells_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [fillominoAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "fillomino_attempt_cells_row_check",
      sql`${table.row} between 0 and 11`,
    ),
    check(
      "fillomino_attempt_cells_col_check",
      sql`${table.col} between 0 and 11`,
    ),
    check(
      "fillomino_attempt_cells_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);
