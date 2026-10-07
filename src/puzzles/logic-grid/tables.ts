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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const gridMarkEnum = pgEnum("grid_mark", ["yes", "no"]);

export const logicGridPuzzles = pgTable(
  "logic_grid_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'logic-grid'`),
  },
  (table) => [
    foreignKey({
      name: "logic_grid_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const logicGridCategories = pgTable(
  "logic_grid_categories",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    primaryKey({
      name: "logic_grid_categories_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "logic_grid_categories_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [logicGridPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("logic_grid_categories_position_check", sql`${table.position} >= 0`),
  ],
);

export const logicGridItems = pgTable(
  "logic_grid_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    puzzleId: uuid("puzzle_id").notNull(),
    categoryPosition: smallint("category_position").notNull(),
    position: smallint("position").notNull(),
    label: text("label").notNull(),
  },
  (table) => [
    unique("logic_grid_items_puzzle_id_id_unique").on(table.puzzleId, table.id),
    unique("logic_grid_items_slot_unique").on(
      table.puzzleId,
      table.categoryPosition,
      table.position,
    ),
    foreignKey({
      name: "logic_grid_items_category_fk",
      columns: [table.puzzleId, table.categoryPosition],
      foreignColumns: [
        logicGridCategories.puzzleId,
        logicGridCategories.position,
      ],
    }).onDelete("cascade"),
    check("logic_grid_items_position_check", sql`${table.position} >= 0`),
  ],
);

export const logicGridClues = pgTable(
  "logic_grid_clues",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    content: text("content").notNull(),
    isFalse: boolean("is_false").notNull().default(false),
  },
  (table) => [
    primaryKey({
      name: "logic_grid_clues_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "logic_grid_clues_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [logicGridPuzzles.puzzleId],
    }).onDelete("cascade"),
    uniqueIndex("logic_grid_clues_one_false_idx")
      .on(table.puzzleId)
      .where(sql`${table.isFalse}`),
    check("logic_grid_clues_position_check", sql`${table.position} >= 0`),
  ],
);

export const logicGridSolutionLinks = pgTable(
  "logic_grid_solution_links",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    itemAId: uuid("item_a_id").notNull(),
    itemBId: uuid("item_b_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "logic_grid_solution_links_pkey",
      columns: [table.puzzleId, table.itemAId, table.itemBId],
    }),
    foreignKey({
      name: "logic_grid_solution_links_item_a_fk",
      columns: [table.puzzleId, table.itemAId],
      foreignColumns: [logicGridItems.puzzleId, logicGridItems.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "logic_grid_solution_links_item_b_fk",
      columns: [table.puzzleId, table.itemBId],
      foreignColumns: [logicGridItems.puzzleId, logicGridItems.id],
    }).onDelete("cascade"),
    check(
      "logic_grid_solution_links_distinct_check",
      sql`${table.itemAId} <> ${table.itemBId}`,
    ),
  ],
);

export const logicGridAttempts = pgTable(
  "logic_grid_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'logic-grid'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    falseCluePosition: smallint("false_clue_position"),
  },
  (table) => [
    foreignKey({
      name: "logic_grid_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("logic_grid_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
    foreignKey({
      name: "logic_grid_attempts_false_clue_fk",
      columns: [table.puzzleId, table.falseCluePosition],
      foreignColumns: [logicGridClues.puzzleId, logicGridClues.position],
    }),
  ],
);

export const logicGridAttemptMarks = pgTable(
  "logic_grid_attempt_marks",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    itemAId: uuid("item_a_id").notNull(),
    itemBId: uuid("item_b_id").notNull(),
    mark: gridMarkEnum("mark").notNull(),
  },
  (table) => [
    primaryKey({
      name: "logic_grid_attempt_marks_pkey",
      columns: [table.attemptId, table.itemAId, table.itemBId],
    }),
    foreignKey({
      name: "logic_grid_attempt_marks_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        logicGridAttempts.attemptId,
        logicGridAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "logic_grid_attempt_marks_item_a_fk",
      columns: [table.puzzleId, table.itemAId],
      foreignColumns: [logicGridItems.puzzleId, logicGridItems.id],
    }),
    foreignKey({
      name: "logic_grid_attempt_marks_item_b_fk",
      columns: [table.puzzleId, table.itemBId],
      foreignColumns: [logicGridItems.puzzleId, logicGridItems.id],
    }),
    check(
      "logic_grid_attempt_marks_distinct_check",
      sql`${table.itemAId} <> ${table.itemBId}`,
    ),
  ],
);

export const logicGridAttemptStruckClues = pgTable(
  "logic_grid_attempt_struck_clues",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    cluePosition: smallint("clue_position").notNull(),
  },
  (table) => [
    primaryKey({
      name: "logic_grid_attempt_struck_clues_pkey",
      columns: [table.attemptId, table.cluePosition],
    }),
    foreignKey({
      name: "logic_grid_attempt_struck_clues_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        logicGridAttempts.attemptId,
        logicGridAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "logic_grid_attempt_struck_clues_clue_fk",
      columns: [table.puzzleId, table.cluePosition],
      foreignColumns: [logicGridClues.puzzleId, logicGridClues.position],
    }),
  ],
);
