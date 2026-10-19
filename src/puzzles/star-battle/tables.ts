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

export const starMarkEnum = pgEnum("star_mark", ["star", "dot"]);

export const starBattlePuzzles = pgTable(
  "star_battle_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'star-battle'`),
    size: smallint("size").notNull(),
    stars: smallint("stars").notNull(),
  },
  (table) => [
    foreignKey({
      name: "star_battle_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("star_battle_puzzles_size_check", sql`${table.size} between 5 and 10`),
    check("star_battle_puzzles_stars_check", sql`${table.stars} between 1 and 2`),
  ],
);

export const starBattleRegionCells = pgTable(
  "star_battle_region_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    region: smallint("region").notNull(),
  },
  (table) => [
    primaryKey({
      name: "star_battle_region_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "star_battle_region_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [starBattlePuzzles.puzzleId],
    }).onDelete("cascade"),
    check("star_battle_region_cells_row_check", sql`${table.row} between 0 and 9`),
    check("star_battle_region_cells_col_check", sql`${table.col} between 0 and 9`),
    check(
      "star_battle_region_cells_region_check",
      sql`${table.region} between 0 and 9`,
    ),
  ],
);

export const starBattleAttempts = pgTable(
  "star_battle_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'star-battle'`),
  },
  (table) => [
    foreignKey({
      name: "star_battle_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const starBattleAttemptMarks = pgTable(
  "star_battle_attempt_marks",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    mark: starMarkEnum("mark").notNull(),
  },
  (table) => [
    primaryKey({
      name: "star_battle_attempt_marks_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "star_battle_attempt_marks_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [starBattleAttempts.attemptId],
    }).onDelete("cascade"),
    check("star_battle_attempt_marks_row_check", sql`${table.row} between 0 and 9`),
    check("star_battle_attempt_marks_col_check", sql`${table.col} between 0 and 9`),
  ],
);
