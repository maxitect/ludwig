import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const oddOneOutPuzzles = pgTable(
  "odd_one_out_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'odd-one-out'`),
    promptText: text("prompt_text").notNull(),
  },
  (table) => [
    foreignKey({
      name: "odd_one_out_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "odd_one_out_puzzles_prompt_text_check",
      sql`char_length(${table.promptText}) between 1 and 300`,
    ),
  ],
);

export const oddOneOutItems = pgTable(
  "odd_one_out_items",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    label: text("label").notNull(),
  },
  (table) => [
    primaryKey({
      name: "odd_one_out_items_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "odd_one_out_items_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [oddOneOutPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("odd_one_out_items_puzzle_id_label_unique").on(
      table.puzzleId,
      table.label,
    ),
    check(
      "odd_one_out_items_position_check",
      sql`${table.position} between 0 and 4`,
    ),
    check(
      "odd_one_out_items_label_check",
      sql`char_length(${table.label}) between 1 and 60`,
    ),
  ],
);

export const oddOneOutSolutions = pgTable(
  "odd_one_out_solutions",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    itemPosition: smallint("item_position").notNull(),
    explanation: text("explanation").notNull(),
  },
  (table) => [
    foreignKey({
      name: "odd_one_out_solutions_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [oddOneOutPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "odd_one_out_solutions_item_fk",
      columns: [table.puzzleId, table.itemPosition],
      foreignColumns: [oddOneOutItems.puzzleId, oddOneOutItems.position],
    }),
    check(
      "odd_one_out_solutions_explanation_check",
      sql`char_length(btrim(${table.explanation})) between 1 and 600`,
    ),
  ],
);

export const oddOneOutAttempts = pgTable(
  "odd_one_out_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'odd-one-out'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    itemPosition: smallint("item_position"),
  },
  (table) => [
    foreignKey({
      name: "odd_one_out_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    foreignKey({
      name: "odd_one_out_attempts_item_fk",
      columns: [table.puzzleId, table.itemPosition],
      foreignColumns: [oddOneOutItems.puzzleId, oddOneOutItems.position],
    }),
  ],
);
