import { sql } from "drizzle-orm";
import {
  char,
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

export const wordSearchPuzzles = pgTable(
  "word_search_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-search'`),
    rows: smallint("rows").notNull(),
    cols: smallint("cols").notNull(),
  },
  (table) => [
    foreignKey({
      name: "word_search_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("word_search_puzzles_rows_check", sql`${table.rows} between 3 and 15`),
    check("word_search_puzzles_cols_check", sql`${table.cols} between 3 and 15`),
  ],
);

export const wordSearchCells = pgTable(
  "word_search_cells",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    letter: char("letter", { length: 1 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_search_cells_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "word_search_cells_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [wordSearchPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("word_search_cells_row_check", sql`${table.row} >= 0`),
    check("word_search_cells_col_check", sql`${table.col} >= 0`),
    check("word_search_cells_letter_check", sql`${table.letter} ~ '^[A-Z]$'`),
  ],
);

/** A hidden word. Where it sits is derived from the grid, never stored. */
export const wordSearchWords = pgTable(
  "word_search_words",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    word: text("word").notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_search_words_pkey",
      columns: [table.puzzleId, table.word],
    }),
    foreignKey({
      name: "word_search_words_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [wordSearchPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("word_search_words_word_check", sql`${table.word} ~ '^[A-Z]{3,15}$'`),
  ],
);

export const wordSearchAttempts = pgTable(
  "word_search_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'word-search'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "word_search_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("word_search_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const wordSearchAttemptFound = pgTable(
  "word_search_attempt_found",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    word: text("word").notNull(),
  },
  (table) => [
    primaryKey({
      name: "word_search_attempt_found_pkey",
      columns: [table.attemptId, table.word],
    }),
    foreignKey({
      name: "word_search_attempt_found_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        wordSearchAttempts.attemptId,
        wordSearchAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "word_search_attempt_found_word_fk",
      columns: [table.puzzleId, table.word],
      foreignColumns: [wordSearchWords.puzzleId, wordSearchWords.word],
    }),
  ],
);
