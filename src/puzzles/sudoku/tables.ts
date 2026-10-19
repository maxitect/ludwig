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
import { ineqDirectionEnum } from "../futoshiki/tables";

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

export const sudokuRegionKindEnum = pgEnum("sudoku_region_kind", [
  "jigsaw",
  "rainbow",
]);

export const sudokuRegionSets = pgTable(
  "sudoku_region_sets",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    kind: sudokuRegionKindEnum("kind").notNull(),
  },
  (table) => [
    foreignKey({
      name: "sudoku_region_sets_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuPuzzles.puzzleId],
    }).onDelete("cascade"),
  ],
);

export const sudokuRegionCells = pgTable(
  "sudoku_region_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    region: smallint("region").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_region_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "sudoku_region_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuRegionSets.puzzleId],
    }).onDelete("cascade"),
    check("sudoku_region_cells_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_region_cells_col_check", sql`${table.col} between 0 and 8`),
    check(
      "sudoku_region_cells_region_check",
      sql`${table.region} between 0 and 8`,
    ),
  ],
);

export const sudokuCages = pgTable(
  "sudoku_cages",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    cage: smallint("cage").notNull(),
    sum: smallint("sum").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_cages_pkey",
      columns: [table.puzzleId, table.cage],
    }),
    foreignKey({
      name: "sudoku_cages_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("sudoku_cages_cage_check", sql`${table.cage} between 0 and 80`),
    check("sudoku_cages_sum_check", sql`${table.sum} between 1 and 45`),
  ],
);

export const sudokuCageCells = pgTable(
  "sudoku_cage_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    cage: smallint("cage").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_cage_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "sudoku_cage_cells_cage_fk",
      columns: [table.puzzleId, table.cage],
      foreignColumns: [sudokuCages.puzzleId, sudokuCages.cage],
    }).onDelete("cascade"),
    check("sudoku_cage_cells_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_cage_cells_col_check", sql`${table.col} between 0 and 8`),
  ],
);

export const xvMarkEnum = pgEnum("xv_mark", ["x", "v"]);

export const sudokuXvSets = pgTable(
  "sudoku_xv_sets",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
  },
  (table) => [
    foreignKey({
      name: "sudoku_xv_sets_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuPuzzles.puzzleId],
    }).onDelete("cascade"),
  ],
);

export const sudokuXvMarks = pgTable(
  "sudoku_xv_marks",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    direction: ineqDirectionEnum("direction").notNull(),
    mark: xvMarkEnum("mark").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sudoku_xv_marks_pkey",
      columns: [table.puzzleId, table.row, table.col, table.direction],
    }),
    foreignKey({
      name: "sudoku_xv_marks_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sudokuXvSets.puzzleId],
    }).onDelete("cascade"),
    check("sudoku_xv_marks_row_check", sql`${table.row} between 0 and 8`),
    check("sudoku_xv_marks_col_check", sql`${table.col} between 0 and 8`),
    check(
      "sudoku_xv_marks_inside_check",
      sql`(${table.direction} = 'right' and ${table.col} <= 7) or (${table.direction} = 'down' and ${table.row} <= 7)`,
    ),
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
