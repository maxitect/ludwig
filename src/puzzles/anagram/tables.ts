import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const anagramPuzzles = pgTable(
  "anagram_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'anagram'`),
    answer: text("answer").notNull(),
    definitionHint: text("definition_hint"),
    scrambleSeed: integer("scramble_seed").notNull(),
  },
  (table) => [
    foreignKey({
      name: "anagram_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "anagram_puzzles_scramble_seed_check",
      sql`${table.scrambleSeed} >= 0`,
    ),
  ],
);

export const anagramAttempts = pgTable(
  "anagram_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'anagram'`),
    answer: text("answer"),
  },
  (table) => [
    foreignKey({
      name: "anagram_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);
