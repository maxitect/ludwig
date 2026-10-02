import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const gearPuzzles = pgTable(
  "gear_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'gears'`),
    slotCount: smallint("slot_count").notNull(),
    mIn: smallint("m_in").notNull(),
    mOut: smallint("m_out").notNull(),
    maxAdjustments: smallint("max_adjustments").notNull(),
    occlusion: boolean("occlusion").notNull(),
    generatorSeed: text("generator_seed"),
  },
  (table) => [
    foreignKey({
      name: "gear_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "gear_puzzles_slot_count_check",
      sql`${table.slotCount} >= 2 and ${table.slotCount} % 2 = 0`,
    ),
    check("gear_puzzles_m_in_m_out_check", sql`${table.mIn} <> ${table.mOut}`),
    check(
      "gear_puzzles_max_adjustments_check",
      sql`${table.maxAdjustments} >= 0`,
    ),
  ],
);

export const gearPuzzleGears = pgTable(
  "gear_puzzle_gears",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    puzzleId: uuid("puzzle_id").notNull(),
    label: text("label").notNull(),
    teeth: smallint("teeth").notNull(),
    startSlot: smallint("start_slot").notNull(),
    initialOffset: smallint("initial_offset").notNull(),
    halfWidthDeg: smallint("half_width_deg").notNull(),
    isDriver: boolean("is_driver").notNull(),
  },
  (table) => [
    foreignKey({
      name: "gear_puzzle_gears_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("gear_puzzle_gears_puzzle_id_id_unique").on(
      table.puzzleId,
      table.id,
    ),
    unique("gear_puzzle_gears_puzzle_id_label_unique").on(
      table.puzzleId,
      table.label,
    ),
    uniqueIndex("gear_puzzle_gears_one_driver_idx")
      .on(table.puzzleId)
      .where(sql`${table.isDriver}`),
    check(
      "gear_puzzle_gears_teeth_check",
      sql`${table.teeth} in (8, 12, 16, 24)`,
    ),
    check("gear_puzzle_gears_start_slot_check", sql`${table.startSlot} >= 0`),
    check(
      "gear_puzzle_gears_initial_offset_check",
      sql`${table.initialOffset} >= 0 and ${table.initialOffset} < ${table.teeth}`,
    ),
    check(
      "gear_puzzle_gears_half_width_deg_check",
      sql`${table.halfWidthDeg} between 1 and 180`,
    ),
  ],
);

export const gearMeshes = pgTable(
  "gear_meshes",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    gearAId: uuid("gear_a_id").notNull(),
    gearBId: uuid("gear_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_meshes_pkey",
      columns: [table.puzzleId, table.gearAId, table.gearBId],
    }),
    foreignKey({
      name: "gear_meshes_gear_a_fk",
      columns: [table.puzzleId, table.gearAId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_meshes_gear_b_fk",
      columns: [table.puzzleId, table.gearBId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }).onDelete("cascade"),
    check("gear_meshes_order_check", sql`${table.gearAId} < ${table.gearBId}`),
  ],
);

export const gearSolutions = pgTable(
  "gear_solutions",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    crank: smallint("crank").notNull(),
    convergence: smallint("convergence").notNull(),
    killerGearId: uuid("killer_gear_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "gear_solutions_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_solutions_killer_gear_fk",
      columns: [table.puzzleId, table.killerGearId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }),
    check("gear_solutions_crank_check", sql`${table.crank} >= 0`),
    check(
      "gear_solutions_convergence_check",
      sql`${table.convergence} between 1 and 8`,
    ),
  ],
);

export const gearSolutionSwaps = pgTable(
  "gear_solution_swaps",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    gearAId: uuid("gear_a_id").notNull(),
    gearBId: uuid("gear_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_solution_swaps_pkey",
      columns: [table.puzzleId, table.gearAId, table.gearBId],
    }),
    foreignKey({
      name: "gear_solution_swaps_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearSolutions.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_solution_swaps_gear_a_fk",
      columns: [table.puzzleId, table.gearAId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_solution_swaps_gear_b_fk",
      columns: [table.puzzleId, table.gearBId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }).onDelete("cascade"),
    check(
      "gear_solution_swaps_order_check",
      sql`${table.gearAId} < ${table.gearBId}`,
    ),
  ],
);

export const gearDaily = pgTable(
  "gear_daily",
  {
    date: date("date", { mode: "string" }).primaryKey(),
    puzzleId: uuid("puzzle_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "gear_daily_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [gearPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("gear_daily_puzzle_id_unique").on(table.puzzleId),
  ],
);

export const gearAttempts = pgTable(
  "gear_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'gears'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    crank: smallint("crank").notNull(),
    convergence: smallint("convergence"),
    accusedGearId: uuid("accused_gear_id"),
  },
  (table) => [
    foreignKey({
      name: "gear_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_attempts_accused_gear_fk",
      columns: [table.puzzleId, table.accusedGearId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }),
    unique("gear_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
    check("gear_attempts_crank_check", sql`${table.crank} >= 0`),
    check(
      "gear_attempts_convergence_check",
      sql`${table.convergence} between 1 and 8`,
    ),
  ],
);

export const gearAttemptSwaps = pgTable(
  "gear_attempt_swaps",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    gearAId: uuid("gear_a_id").notNull(),
    gearBId: uuid("gear_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "gear_attempt_swaps_pkey",
      columns: [table.attemptId, table.gearAId, table.gearBId],
    }),
    foreignKey({
      name: "gear_attempt_swaps_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [gearAttempts.attemptId, gearAttempts.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "gear_attempt_swaps_gear_a_fk",
      columns: [table.puzzleId, table.gearAId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }),
    foreignKey({
      name: "gear_attempt_swaps_gear_b_fk",
      columns: [table.puzzleId, table.gearBId],
      foreignColumns: [gearPuzzleGears.puzzleId, gearPuzzleGears.id],
    }),
    check(
      "gear_attempt_swaps_order_check",
      sql`${table.gearAId} < ${table.gearBId}`,
    ),
  ],
);
