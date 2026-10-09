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

/** Only north and west are stored: a cell's south and east walls are its neighbours' north and west. */
export const wallSideEnum = pgEnum("wall_side", ["north", "west"]);

export const cctvMazePuzzles = pgTable(
  "cctv_maze_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'cctv-maze'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
    startRow: smallint("start_row").notNull(),
    startCol: smallint("start_col").notNull(),
    exitRow: smallint("exit_row").notNull(),
    exitCol: smallint("exit_col").notNull(),
  },
  (table) => [
    foreignKey({
      name: "cctv_maze_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("cctv_maze_puzzles_rows_check", sql`${table.rows} between 3 and 15`),
    check("cctv_maze_puzzles_cols_check", sql`${table.cols} between 3 and 15`),
    check(
      "cctv_maze_puzzles_start_row_check",
      sql`${table.startRow} between 0 and ${table.rows} - 1`,
    ),
    check(
      "cctv_maze_puzzles_start_col_check",
      sql`${table.startCol} between 0 and ${table.cols} - 1`,
    ),
    check(
      "cctv_maze_puzzles_exit_row_check",
      sql`${table.exitRow} between 0 and ${table.rows} - 1`,
    ),
    check(
      "cctv_maze_puzzles_exit_col_check",
      sql`${table.exitCol} between 0 and ${table.cols} - 1`,
    ),
  ],
);

export const cctvMazeWalls = pgTable(
  "cctv_maze_walls",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    side: wallSideEnum("side").notNull(),
  },
  (table) => [
    primaryKey({
      name: "cctv_maze_walls_pkey",
      columns: [table.puzzleId, table.row, table.col, table.side],
    }),
    foreignKey({
      name: "cctv_maze_walls_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [cctvMazePuzzles.puzzleId],
    }).onDelete("cascade"),
    check("cctv_maze_walls_row_check", sql`${table.row} >= 0`),
    check("cctv_maze_walls_col_check", sql`${table.col} >= 0`),
  ],
);

export const cctvMazeCameras = pgTable(
  "cctv_maze_cameras",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    facing: compass8Enum("facing").notNull(),
    fovDeg: smallint("fov_deg").notNull(),
    rangeCells: smallint("range_cells").notNull(),
  },
  (table) => [
    primaryKey({
      name: "cctv_maze_cameras_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "cctv_maze_cameras_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [cctvMazePuzzles.puzzleId],
    }).onDelete("cascade"),
    check("cctv_maze_cameras_row_check", sql`${table.row} >= 0`),
    check("cctv_maze_cameras_col_check", sql`${table.col} >= 0`),
    check(
      "cctv_maze_cameras_fov_deg_check",
      sql`${table.fovDeg} between 1 and 360`,
    ),
    check("cctv_maze_cameras_range_cells_check", sql`${table.rangeCells} >= 1`),
  ],
);

export const cctvMazeAttempts = pgTable(
  "cctv_maze_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'cctv-maze'`),
  },
  (table) => [
    foreignKey({
      name: "cctv_maze_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

/** One cell of the player's path, step 0 first. It names no content row, so a content edit cannot orphan it. */
export const cctvMazeAttemptSteps = pgTable(
  "cctv_maze_attempt_steps",
  {
    attemptId: uuid("attempt_id").notNull(),
    step: smallint("step").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "cctv_maze_attempt_steps_pkey",
      columns: [table.attemptId, table.step],
    }),
    foreignKey({
      name: "cctv_maze_attempt_steps_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [cctvMazeAttempts.attemptId],
    }).onDelete("cascade"),
    check("cctv_maze_attempt_steps_step_check", sql`${table.step} >= 0`),
    check("cctv_maze_attempt_steps_row_check", sql`${table.row} >= 0`),
    check("cctv_maze_attempt_steps_col_check", sql`${table.col} >= 0`),
  ],
);
