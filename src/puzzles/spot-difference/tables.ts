import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  smallint,
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
    sceneSeed: integer("scene_seed").notNull(),
    differenceCount: smallint("difference_count").notNull(),
    generatorVersion: smallint("generator_version").notNull(),
  },
  (table) => [
    foreignKey({
      name: "spot_difference_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "spot_difference_puzzles_scene_seed_check",
      sql`${table.sceneSeed} >= 0`,
    ),
    check(
      "spot_difference_puzzles_difference_count_check",
      sql`${table.differenceCount} between 1 and 15`,
    ),
    check(
      "spot_difference_puzzles_generator_version_check",
      sql`${table.generatorVersion} >= 1`,
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
  },
  (table) => [
    foreignKey({
      name: "spot_difference_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const spotDifferenceAttemptFound = pgTable(
  "spot_difference_attempt_found",
  {
    attemptId: uuid("attempt_id").notNull(),
    differenceIndex: smallint("difference_index").notNull(),
  },
  (table) => [
    primaryKey({
      name: "spot_difference_attempt_found_pkey",
      columns: [table.attemptId, table.differenceIndex],
    }),
    foreignKey({
      name: "spot_difference_attempt_found_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [spotDifferenceAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "spot_difference_attempt_found_difference_index_check",
      sql`${table.differenceIndex} between 0 and 14`,
    ),
  ],
);
