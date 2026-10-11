import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  smallint,
  unique,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const spotDifferencePuzzles = pgTable(
  "spot_difference_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'spot-difference'`),
    sceneKey: text("scene_key").notNull(),
  },
  (table) => [
    foreignKey({
      name: "spot_difference_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "spot_difference_puzzles_scene_key_check",
      sql`${table.sceneKey} <> ''`,
    ),
  ],
);

export const spotDifferenceDifferences = pgTable(
  "spot_difference_differences",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    differenceIndex: smallint("difference_index").notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
  },
  (table) => [
    primaryKey({
      name: "spot_difference_differences_pkey",
      columns: [table.puzzleId, table.differenceIndex],
    }),
    foreignKey({
      name: "spot_difference_differences_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [spotDifferencePuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "spot_difference_differences_difference_index_check",
      sql`${table.differenceIndex} between 0 and 14`,
    ),
    check(
      "spot_difference_differences_origin_check",
      sql`${table.x} >= 0 and ${table.y} >= 0`,
    ),
    check(
      "spot_difference_differences_size_check",
      sql`${table.width} > 0 and ${table.height} > 0`,
    ),
  ],
);

export const spotDifferenceAttempts = pgTable(
  "spot_difference_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'spot-difference'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "spot_difference_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("spot_difference_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const spotDifferenceAttemptFound = pgTable(
  "spot_difference_attempt_found",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    differenceIndex: smallint("difference_index").notNull(),
  },
  (table) => [
    primaryKey({
      name: "spot_difference_attempt_found_pkey",
      columns: [table.attemptId, table.differenceIndex],
    }),
    foreignKey({
      name: "spot_difference_attempt_found_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        spotDifferenceAttempts.attemptId,
        spotDifferenceAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "spot_difference_attempt_found_difference_fk",
      columns: [table.puzzleId, table.differenceIndex],
      foreignColumns: [
        spotDifferenceDifferences.puzzleId,
        spotDifferenceDifferences.differenceIndex,
      ],
    }),
  ],
);
