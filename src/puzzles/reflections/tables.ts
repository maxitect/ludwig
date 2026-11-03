import { sql } from "drizzle-orm";
import {
  char,
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

/** A two-sided diagonal mirror: `slash` is `/`, `backslash` is `\`. */
export const mirrorKindEnum = pgEnum("mirror_kind", ["slash", "backslash"]);

export const reflectionsPuzzles = pgTable(
  "reflections_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'reflections'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "reflections_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("reflections_puzzles_rows_check", sql`${table.rows} between 4 and 10`),
    check("reflections_puzzles_cols_check", sql`${table.cols} between 4 and 10`),
  ],
);

/** A mirror the puzzle fixes in a cell. */
export const reflectionsFixedMirrors = pgTable(
  "reflections_fixed_mirrors",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    mirror: mirrorKindEnum("mirror").notNull(),
  },
  (table) => [
    primaryKey({
      name: "reflections_fixed_mirrors_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "reflections_fixed_mirrors_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [reflectionsPuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "reflections_fixed_mirrors_row_check",
      sql`${table.row} between 0 and 9`,
    ),
    check(
      "reflections_fixed_mirrors_col_check",
      sql`${table.col} between 0 and 9`,
    ),
  ],
);

/** A cell the player puts a mirror in. */
export const reflectionsSlots = pgTable(
  "reflections_slots",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "reflections_slots_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "reflections_slots_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [reflectionsPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("reflections_slots_row_check", sql`${table.row} between 0 and 9`),
    check("reflections_slots_col_check", sql`${table.col} between 0 and 9`),
  ],
);

/**
 * A lettered port on the edge of the grid. `offset` is the column along a north or south edge and
 * the row along an east or west edge. Unlettered ports are not stored.
 */
export const reflectionsPorts = pgTable(
  "reflections_ports",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    side: compass8Enum("side").notNull(),
    offset: smallint("offset").notNull(),
    label: char("label", { length: 1 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "reflections_ports_pkey",
      columns: [table.puzzleId, table.side, table.offset],
    }),
    foreignKey({
      name: "reflections_ports_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [reflectionsPuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "reflections_ports_side_check",
      sql`${table.side} in ('n', 'e', 's', 'w')`,
    ),
    check(
      "reflections_ports_offset_check",
      sql`${table.offset} between 0 and 9`,
    ),
    check("reflections_ports_label_check", sql`${table.label} ~ '^[A-Z]$'`),
  ],
);

export const reflectionsAttempts = pgTable(
  "reflections_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'reflections'`),
  },
  (table) => [
    foreignKey({
      name: "reflections_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const reflectionsAttemptMirrors = pgTable(
  "reflections_attempt_mirrors",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    mirror: mirrorKindEnum("mirror").notNull(),
  },
  (table) => [
    primaryKey({
      name: "reflections_attempt_mirrors_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "reflections_attempt_mirrors_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [reflectionsAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "reflections_attempt_mirrors_row_check",
      sql`${table.row} between 0 and 9`,
    ),
    check(
      "reflections_attempt_mirrors_col_check",
      sql`${table.col} between 0 and 9`,
    ),
  ],
);
