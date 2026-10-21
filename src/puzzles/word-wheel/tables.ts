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
import { words } from "../word-ladder/tables";

export const wordWheelPuzzles = pgTable(
  "word_wheel_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-wheel'`),
    targetWord: text("target_word").notNull(),
    centrePosition: smallint("centre_position").notNull(),
    scrambleSeed: integer("scramble_seed").notNull(),
    minLength: smallint("min_length").notNull(),
  },
  (table) => [
    foreignKey({
      name: "word_wheel_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    foreignKey({
      name: "word_wheel_puzzles_target_word_fk",
      columns: [table.targetWord],
      foreignColumns: [words.word],
    }),
    check(
      "word_wheel_puzzles_target_word_check",
      sql`length(${table.targetWord}) = 9`,
    ),
    check(
      "word_wheel_puzzles_centre_position_check",
      sql`${table.centrePosition} between 0 and 8`,
    ),
    check(
      "word_wheel_puzzles_scramble_seed_check",
      sql`${table.scrambleSeed} >= 0`,
    ),
    check(
      "word_wheel_puzzles_min_length_check",
      sql`${table.minLength} between 4 and 5`,
    ),
  ],
);

export const wordWheelAttempts = pgTable(
  "word_wheel_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-wheel'`),
  },
  (table) => [
    foreignKey({
      name: "word_wheel_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

/** The words the server accepted for the attempt. Each is a dictionary word, so the FK is strict. */
export const wordWheelAttemptWords = pgTable(
  "word_wheel_attempt_words",
  {
    attemptId: uuid("attempt_id").notNull(),
    word: text("word").notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_wheel_attempt_words_pkey",
      columns: [table.attemptId, table.word],
    }),
    foreignKey({
      name: "word_wheel_attempt_words_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [wordWheelAttempts.attemptId],
    }).onDelete("cascade"),
    foreignKey({
      name: "word_wheel_attempt_words_word_fk",
      columns: [table.word],
      foreignColumns: [words.word],
    }),
  ],
);
