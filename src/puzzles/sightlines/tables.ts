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

export const compass8Enum = pgEnum("compass8", [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
]);

export const sightlinesPuzzles = pgTable(
  "sightlines_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'sightlines'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
    targetRow: smallint("target_row").notNull(),
    targetCol: smallint("target_col").notNull(),
  },
  (table) => [
    foreignKey({
      name: "sightlines_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("sightlines_puzzles_rows_check", sql`${table.rows} between 3 and 15`),
    check("sightlines_puzzles_cols_check", sql`${table.cols} between 3 and 15`),
    check(
      "sightlines_puzzles_target_row_check",
      sql`${table.targetRow} between 0 and ${table.rows} - 1`,
    ),
    check(
      "sightlines_puzzles_target_col_check",
      sql`${table.targetCol} between 0 and ${table.cols} - 1`,
    ),
  ],
);

export const sightlinesObstacles = pgTable(
  "sightlines_obstacles",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sightlines_obstacles_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "sightlines_obstacles_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sightlinesPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("sightlines_obstacles_row_check", sql`${table.row} >= 0`),
    check("sightlines_obstacles_col_check", sql`${table.col} >= 0`),
  ],
);

export const sightlinesObservers = pgTable(
  "sightlines_observers",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    facing: compass8Enum("facing").notNull(),
    fovDeg: smallint("fov_deg").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sightlines_observers_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "sightlines_observers_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [sightlinesPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("sightlines_observers_row_check", sql`${table.row} >= 0`),
    check("sightlines_observers_col_check", sql`${table.col} >= 0`),
    check(
      "sightlines_observers_fov_deg_check",
      sql`${table.fovDeg} between 1 and 360`,
    ),
  ],
);

export const sightlinesAttempts = pgTable(
  "sightlines_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'sightlines'`),
  },
  (table) => [
    foreignKey({
      name: "sightlines_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

/** A cell the player has marked as a blind spot. It names no content row, so a content edit cannot orphan it. */
export const sightlinesAttemptMarks = pgTable(
  "sightlines_attempt_marks",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "sightlines_attempt_marks_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "sightlines_attempt_marks_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [sightlinesAttempts.attemptId],
    }).onDelete("cascade"),
    check("sightlines_attempt_marks_row_check", sql`${table.row} >= 0`),
    check("sightlines_attempt_marks_col_check", sql`${table.col} >= 0`),
  ],
);
