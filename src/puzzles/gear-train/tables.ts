import { sql } from "drizzle-orm";
import {
  boolean,
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

export const gearTrainRoleEnum = pgEnum("gear_train_role", [
  "driver",
  "target",
]);

export const gearTrainPuzzles = pgTable(
  "gear_train_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'gear-train'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
    targetClockwise: boolean("target_clockwise").notNull(),
  },
  (table) => [
    foreignKey({
      name: "gear_train_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("gear_train_puzzles_rows_check", sql`${table.rows} between 4 and 12`),
    check("gear_train_puzzles_cols_check", sql`${table.cols} between 4 and 12`),
  ],
);

export const gearTrainFixedCogs = pgTable(
  "gear_train_fixed_cogs",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    role: gearTrainRoleEnum("role").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    teeth: smallint("teeth").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_train_fixed_cogs_pkey",
      columns: [table.puzzleId, table.role],
    }),
    foreignKey({
      name: "gear_train_fixed_cogs_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearTrainPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("gear_train_fixed_cogs_puzzle_id_row_col_unique").on(
      table.puzzleId,
      table.row,
      table.col,
    ),
    check(
      "gear_train_fixed_cogs_teeth_check",
      sql`${table.teeth} in (8, 16, 24)`,
    ),
  ],
);

export const gearTrainBolts = pgTable(
  "gear_train_bolts",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_train_bolts_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "gear_train_bolts_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearTrainPuzzles.puzzleId],
    }).onDelete("cascade"),
  ],
);

export const gearTrainInventory = pgTable(
  "gear_train_inventory",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    teeth: smallint("teeth").notNull(),
    count: smallint("count").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_train_inventory_pkey",
      columns: [table.puzzleId, table.teeth],
    }),
    foreignKey({
      name: "gear_train_inventory_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearTrainPuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "gear_train_inventory_teeth_check",
      sql`${table.teeth} in (8, 16, 24)`,
    ),
    check(
      "gear_train_inventory_count_check",
      sql`${table.count} between 1 and 6`,
    ),
  ],
);

export const gearTrainSolutionCogs = pgTable(
  "gear_train_solution_cogs",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    teeth: smallint("teeth").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_train_solution_cogs_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "gear_train_solution_cogs_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearTrainPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_train_solution_cogs_inventory_fk",
      columns: [table.puzzleId, table.teeth],
      foreignColumns: [gearTrainInventory.puzzleId, gearTrainInventory.teeth],
    }),
  ],
);

export const gearTrainAttempts = pgTable(
  "gear_train_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'gear-train'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "gear_train_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("gear_train_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const gearTrainAttemptCogs = pgTable(
  "gear_train_attempt_cogs",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    teeth: smallint("teeth").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_train_attempt_cogs_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "gear_train_attempt_cogs_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [gearTrainAttempts.attemptId, gearTrainAttempts.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_train_attempt_cogs_inventory_fk",
      columns: [table.puzzleId, table.teeth],
      foreignColumns: [gearTrainInventory.puzzleId, gearTrainInventory.teeth],
    }),
  ],
);
