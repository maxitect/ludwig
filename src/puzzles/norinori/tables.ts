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

export const norinoriMarkEnum = pgEnum("norinori_mark", ["shade", "dot"]);

export const norinoriPuzzles = pgTable(
  "norinori_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'norinori'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "norinori_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("norinori_puzzles_rows_check", sql`${table.rows} between 5 and 12`),
    check("norinori_puzzles_cols_check", sql`${table.cols} between 5 and 12`),
  ],
);

export const norinoriRegionCells = pgTable(
  "norinori_region_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    region: smallint("region").notNull(),
  },
  (table) => [
    primaryKey({
      name: "norinori_region_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "norinori_region_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [norinoriPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("norinori_region_cells_row_check", sql`${table.row} between 0 and 11`),
    check("norinori_region_cells_col_check", sql`${table.col} between 0 and 11`),
    check("norinori_region_cells_region_check", sql`${table.region} >= 0`),
  ],
);

export const norinoriAttempts = pgTable(
  "norinori_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'norinori'`),
  },
  (table) => [
    foreignKey({
      name: "norinori_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const norinoriAttemptMarks = pgTable(
  "norinori_attempt_marks",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    mark: norinoriMarkEnum("mark").notNull(),
  },
  (table) => [
    primaryKey({
      name: "norinori_attempt_marks_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "norinori_attempt_marks_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [norinoriAttempts.attemptId],
    }).onDelete("cascade"),
    check("norinori_attempt_marks_row_check", sql`${table.row} between 0 and 11`),
    check("norinori_attempt_marks_col_check", sql`${table.col} between 0 and 11`),
  ],
);
