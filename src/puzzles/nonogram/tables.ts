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

export const nonogramMarkEnum = pgEnum("nonogram_mark", ["fill", "cross"]);

export const nonogramPuzzles = pgTable(
  "nonogram_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'nonogram'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
    /** (S) The picture's caption. It names the picture, so it is revealed only once solved. */
    caption: text("caption").notNull(),
  },
  (table) => [
    foreignKey({
      name: "nonogram_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("nonogram_puzzles_rows_check", sql`${table.rows} between 5 and 25`),
    check("nonogram_puzzles_cols_check", sql`${table.cols} between 5 and 25`),
  ],
);

/** (S) The shaded cells of the picture. The run clues are derived from them. */
export const nonogramCells = pgTable(
  "nonogram_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "nonogram_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "nonogram_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [nonogramPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("nonogram_cells_row_check", sql`${table.row} between 0 and 24`),
    check("nonogram_cells_col_check", sql`${table.col} between 0 and 24`),
  ],
);

export const nonogramAttempts = pgTable(
  "nonogram_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'nonogram'`),
  },
  (table) => [
    foreignKey({
      name: "nonogram_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const nonogramAttemptMarks = pgTable(
  "nonogram_attempt_marks",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    mark: nonogramMarkEnum("mark").notNull(),
  },
  (table) => [
    primaryKey({
      name: "nonogram_attempt_marks_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "nonogram_attempt_marks_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [nonogramAttempts.attemptId],
    }).onDelete("cascade"),
    check("nonogram_attempt_marks_row_check", sql`${table.row} between 0 and 24`),
    check("nonogram_attempt_marks_col_check", sql`${table.col} between 0 and 24`),
  ],
);
