import { sql } from "drizzle-orm";
import {
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
import { chessFileEnum, puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const rotaPhaseEnum = pgEnum("rota_phase", ["intended", "final"]);
export const rotaClueKindEnum = pgEnum("rota_clue_kind", [
  "unpowered_square",
  "adjacent_only",
  "never_in_rank",
  "max_swaps",
]);

export const rotaPuzzles = pgTable(
  "rota_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'rota'`),
  },
  (table) => [
    foreignKey({
      name: "rota_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const rotaWorkers = pgTable(
  "rota_workers",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    puzzleId: uuid("puzzle_id").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_workers_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [rotaPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("rota_workers_puzzle_id_id_unique").on(table.puzzleId, table.id),
    unique("rota_workers_puzzle_id_name_unique").on(table.puzzleId, table.name),
  ],
);

export const rotaWorkerSquares = pgTable(
  "rota_worker_squares",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    workerId: uuid("worker_id").notNull(),
    phase: rotaPhaseEnum("phase").notNull(),
    file: chessFileEnum("file").notNull(),
    rank: smallint("rank").notNull(),
  },
  (table) => [
    primaryKey({
      name: "rota_worker_squares_pkey",
      columns: [table.puzzleId, table.workerId, table.phase],
    }),
    foreignKey({
      name: "rota_worker_squares_worker_fk",
      columns: [table.puzzleId, table.workerId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }).onDelete("cascade"),
    unique("rota_worker_squares_puzzle_id_phase_square_unique").on(
      table.puzzleId,
      table.phase,
      table.file,
      table.rank,
    ),
    check("rota_worker_squares_rank_check", sql`${table.rank} between 1 and 8`),
  ],
);

export const rotaClues = pgTable(
  "rota_clues",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    kind: rotaClueKindEnum("kind").notNull(),
    displayText: text("display_text").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_clues_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [rotaPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("rota_clues_id_kind_unique").on(table.id, table.kind),
    unique("rota_clues_id_puzzle_id_unique").on(table.id, table.puzzleId),
    unique("rota_clues_puzzle_id_position_unique").on(
      table.puzzleId,
      table.position,
    ),
    check("rota_clues_position_check", sql`${table.position} >= 0`),
  ],
);

export const rotaClueUnpoweredSquare = pgTable(
  "rota_clue_unpowered_square",
  {
    clueId: uuid("clue_id").primaryKey(),
    kind: rotaClueKindEnum("kind")
      .notNull()
      .generatedAlwaysAs(sql`'unpowered_square'::rota_clue_kind`),
    file: chessFileEnum("file").notNull(),
    rank: smallint("rank").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_clue_unpowered_square_clue_id_kind_fk",
      columns: [table.clueId, table.kind],
      foreignColumns: [rotaClues.id, rotaClues.kind],
    }).onDelete("cascade"),
    check(
      "rota_clue_unpowered_square_rank_check",
      sql`${table.rank} between 1 and 8`,
    ),
  ],
);

export const rotaClueNeverInRank = pgTable(
  "rota_clue_never_in_rank",
  {
    clueId: uuid("clue_id").primaryKey(),
    kind: rotaClueKindEnum("kind")
      .notNull()
      .generatedAlwaysAs(sql`'never_in_rank'::rota_clue_kind`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    workerId: uuid("worker_id").notNull(),
    rank: smallint("rank").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_clue_never_in_rank_clue_id_kind_fk",
      columns: [table.clueId, table.kind],
      foreignColumns: [rotaClues.id, rotaClues.kind],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_clue_never_in_rank_clue_id_puzzle_id_fk",
      columns: [table.clueId, table.puzzleId],
      foreignColumns: [rotaClues.id, rotaClues.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_clue_never_in_rank_worker_fk",
      columns: [table.puzzleId, table.workerId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }).onDelete("cascade"),
    check(
      "rota_clue_never_in_rank_rank_check",
      sql`${table.rank} between 1 and 8`,
    ),
  ],
);

export const rotaClueMaxSwaps = pgTable(
  "rota_clue_max_swaps",
  {
    clueId: uuid("clue_id").primaryKey(),
    kind: rotaClueKindEnum("kind")
      .notNull()
      .generatedAlwaysAs(sql`'max_swaps'::rota_clue_kind`),
    maxSwaps: smallint("max_swaps").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_clue_max_swaps_clue_id_kind_fk",
      columns: [table.clueId, table.kind],
      foreignColumns: [rotaClues.id, rotaClues.kind],
    }).onDelete("cascade"),
    check("rota_clue_max_swaps_max_swaps_check", sql`${table.maxSwaps} >= 1`),
  ],
);

export const rotaSolutions = pgTable(
  "rota_solutions",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    instigatorWorkerId: uuid("instigator_worker_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "rota_solutions_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [rotaPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_solutions_instigator_fk",
      columns: [table.puzzleId, table.instigatorWorkerId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }),
  ],
);

export const rotaSolutionSwaps = pgTable(
  "rota_solution_swaps",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    step: smallint("step").notNull(),
    workerAId: uuid("worker_a_id").notNull(),
    workerBId: uuid("worker_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "rota_solution_swaps_pkey",
      columns: [table.puzzleId, table.step],
    }),
    foreignKey({
      name: "rota_solution_swaps_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [rotaSolutions.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_solution_swaps_worker_a_fk",
      columns: [table.puzzleId, table.workerAId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_solution_swaps_worker_b_fk",
      columns: [table.puzzleId, table.workerBId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }).onDelete("cascade"),
    check("rota_solution_swaps_step_check", sql`${table.step} >= 1`),
    check(
      "rota_solution_swaps_distinct_check",
      sql`${table.workerAId} <> ${table.workerBId}`,
    ),
  ],
);

export const rotaAttempts = pgTable(
  "rota_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'rota'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "rota_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("rota_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const rotaAttemptSwaps = pgTable(
  "rota_attempt_swaps",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    step: smallint("step").notNull(),
    workerAId: uuid("worker_a_id").notNull(),
    workerBId: uuid("worker_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "rota_attempt_swaps_pkey",
      columns: [table.attemptId, table.step],
    }),
    foreignKey({
      name: "rota_attempt_swaps_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [rotaAttempts.attemptId, rotaAttempts.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "rota_attempt_swaps_worker_a_fk",
      columns: [table.puzzleId, table.workerAId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }),
    foreignKey({
      name: "rota_attempt_swaps_worker_b_fk",
      columns: [table.puzzleId, table.workerBId],
      foreignColumns: [rotaWorkers.puzzleId, rotaWorkers.id],
    }),
    check("rota_attempt_swaps_step_check", sql`${table.step} >= 1`),
    check(
      "rota_attempt_swaps_distinct_check",
      sql`${table.workerAId} <> ${table.workerBId}`,
    ),
  ],
);
