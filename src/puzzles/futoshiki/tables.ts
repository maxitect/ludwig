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

export const ineqDirectionEnum = pgEnum("ineq_direction", ["right", "down"]);
export const ineqRelationEnum = pgEnum("ineq_relation", ["lt", "gt"]);

export const futoshikiPuzzles = pgTable(
  "futoshiki_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'futoshiki'`),
    size: smallint("size").notNull(),
  },
  (table) => [
    foreignKey({
      name: "futoshiki_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("futoshiki_puzzles_size_check", sql`${table.size} between 4 and 7`),
  ],
);

export const futoshikiGivens = pgTable(
  "futoshiki_givens",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "futoshiki_givens_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "futoshiki_givens_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [futoshikiPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("futoshiki_givens_row_check", sql`${table.row} between 0 and 6`),
    check("futoshiki_givens_col_check", sql`${table.col} between 0 and 6`),
    check("futoshiki_givens_digit_check", sql`${table.digit} between 1 and 9`),
  ],
);

/** The sign between a cell and its right or lower neighbour; `lt` means the cell is smaller than that neighbour. */
export const futoshikiInequalities = pgTable(
  "futoshiki_inequalities",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    direction: ineqDirectionEnum("direction").notNull(),
    relation: ineqRelationEnum("relation").notNull(),
  },
  (table) => [
    primaryKey({
      name: "futoshiki_inequalities_pkey",
      columns: [table.puzzleId, table.row, table.col, table.direction],
    }),
    foreignKey({
      name: "futoshiki_inequalities_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [futoshikiPuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "futoshiki_inequalities_row_check",
      sql`${table.row} between 0 and 6`,
    ),
    check(
      "futoshiki_inequalities_col_check",
      sql`${table.col} between 0 and 6`,
    ),
  ],
);

export const futoshikiAttempts = pgTable(
  "futoshiki_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'futoshiki'`),
  },
  (table) => [
    foreignKey({
      name: "futoshiki_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const futoshikiAttemptCells = pgTable(
  "futoshiki_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "futoshiki_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "futoshiki_attempt_cells_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [futoshikiAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "futoshiki_attempt_cells_row_check",
      sql`${table.row} between 0 and 6`,
    ),
    check(
      "futoshiki_attempt_cells_col_check",
      sql`${table.col} between 0 and 6`,
    ),
    check(
      "futoshiki_attempt_cells_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);

export const futoshikiAttemptNotes = pgTable(
  "futoshiki_attempt_notes",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "futoshiki_attempt_notes_pkey",
      columns: [table.attemptId, table.row, table.col, table.digit],
    }),
    foreignKey({
      name: "futoshiki_attempt_notes_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [futoshikiAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "futoshiki_attempt_notes_row_check",
      sql`${table.row} between 0 and 6`,
    ),
    check(
      "futoshiki_attempt_notes_col_check",
      sql`${table.col} between 0 and 6`,
    ),
    check(
      "futoshiki_attempt_notes_digit_check",
      sql`${table.digit} between 1 and 9`,
    ),
  ],
);
