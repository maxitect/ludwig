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

export const acrosticRuleEnum = pgEnum("acrostic_rule", [
  "first_letter_line",
  "first_letter_word",
  "last_letter_line",
]);

/** The hidden message is derived from the lines by the rule, so it has no column. */
export const acrosticPuzzles = pgTable(
  "acrostic_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'acrostic'`),
    rule: acrosticRuleEnum("rule").notNull(),
  },
  (table) => [
    foreignKey({
      name: "acrostic_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const acrosticLines = pgTable(
  "acrostic_lines",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    content: text("content").notNull(),
  },
  (table) => [
    primaryKey({
      name: "acrostic_lines_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "acrostic_lines_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [acrosticPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("acrostic_lines_position_check", sql`${table.position} >= 0`),
    check(
      "acrostic_lines_content_check",
      sql`char_length(${table.content}) between 1 and 300 and ${table.content} ~ '[[:alpha:]]'`,
    ),
  ],
);

export const acrosticAttempts = pgTable(
  "acrostic_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'acrostic'`),
    answer: text("answer"),
  },
  (table) => [
    foreignKey({
      name: "acrostic_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
    check(
      "acrostic_attempts_answer_check",
      sql`char_length(${table.answer}) <= 80`,
    ),
  ],
);
