import { sql } from "drizzle-orm";
import { pgTable, primaryKey, smallint, text, uuid } from "drizzle-orm/pg-core";

export const fixturePuzzles = pgTable("fixture_puzzles", {
  puzzleId: uuid("puzzle_id").primaryKey(),
  typeKey: text("type_key").generatedAlwaysAs(sql`'__fixture'`),
  note: text("note").notNull(),
});

export const fixtureItems = pgTable(
  "fixture_items",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    label: text("label").notNull(),
  },
  (table) => [primaryKey({ columns: [table.puzzleId, table.position] })],
);

export const fixtureAttemptRows = pgTable(
  "__fixture_attempt_rows",
  {
    attemptId: uuid("attempt_id").notNull(),
    position: smallint("position").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.position] })],
);
