import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

/** The dictionary: lowercase a to z, 3 to 6 letters, no proper nouns. Seeded from `content/words.txt`. */
export const words = pgTable(
  "words",
  { word: text("word").primaryKey() },
  (table) => [check("words_word_check", sql`${table.word} ~ '^[a-z]{3,6}$'`)],
);

export const wordLadderPuzzles = pgTable(
  "word_ladder_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-ladder'`),
    startWord: text("start_word").notNull(),
    endWord: text("end_word").notNull(),
    rungCount: smallint("rung_count").notNull(),
  },
  (table) => [
    foreignKey({
      name: "word_ladder_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    foreignKey({
      name: "word_ladder_puzzles_start_word_fk",
      columns: [table.startWord],
      foreignColumns: [words.word],
    }),
    foreignKey({
      name: "word_ladder_puzzles_end_word_fk",
      columns: [table.endWord],
      foreignColumns: [words.word],
    }),
    check("word_ladder_puzzles_rung_count_check", sql`${table.rungCount} >= 1`),
  ],
);

/** A reference ladder: the rungs between the start and end words, in order. */
export const wordLadderSolutionRungs = pgTable(
  "word_ladder_solution_rungs",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    word: text("word").notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_ladder_solution_rungs_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "word_ladder_solution_rungs_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [wordLadderPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "word_ladder_solution_rungs_word_fk",
      columns: [table.word],
      foreignColumns: [words.word],
    }),
    check(
      "word_ladder_solution_rungs_position_check",
      sql`${table.position} >= 0`,
    ),
  ],
);

export const wordLadderAttempts = pgTable(
  "word_ladder_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-ladder'`),
  },
  (table) => [
    foreignKey({
      name: "word_ladder_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

/** The player's typed words, which may be partial or not words at all, so there is no FK to `words`. */
export const wordLadderAttemptRungs = pgTable(
  "word_ladder_attempt_rungs",
  {
    attemptId: uuid("attempt_id").notNull(),
    position: smallint("position").notNull(),
    word: text("word").notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_ladder_attempt_rungs_pkey",
      columns: [table.attemptId, table.position],
    }),
    foreignKey({
      name: "word_ladder_attempt_rungs_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [wordLadderAttempts.attemptId],
    }).onDelete("cascade"),
    check(
      "word_ladder_attempt_rungs_position_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "word_ladder_attempt_rungs_word_check",
      sql`${table.word} ~ '^[a-z]{1,6}$'`,
    ),
  ],
);
