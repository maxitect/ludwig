import { sql } from "drizzle-orm";
import {
  char,
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

/** The one global alphabet. `asset_key` is a neutral file stem and never reveals the `letter`. */
export const pictogramGlyphs = pgTable(
  "pictogram_glyphs",
  {
    id: smallint("id").primaryKey(),
    assetKey: text("asset_key").notNull().unique(),
    letter: char("letter", { length: 1 }).notNull().unique(),
  },
  (table) => [
    check(
      "pictogram_glyphs_asset_key_check",
      sql`${table.assetKey} ~ '^glyph-[0-9]{2}$'`,
    ),
    check("pictogram_glyphs_letter_check", sql`${table.letter} ~ '^[a-z]$'`),
  ],
);

export const pictogramCipherPuzzles = pgTable(
  "pictogram_cipher_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'pictogram-cipher'`),
  },
  (table) => [
    foreignKey({
      name: "pictogram_cipher_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

/** One glyph of the message. The plaintext is never stored: it is these glyphs' letters in order. */
export const pictogramCipherSymbols = pgTable(
  "pictogram_cipher_symbols",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    wordIndex: smallint("word_index").notNull(),
    position: smallint("position").notNull(),
    glyphId: smallint("glyph_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "pictogram_cipher_symbols_pkey",
      columns: [table.puzzleId, table.wordIndex, table.position],
    }),
    foreignKey({
      name: "pictogram_cipher_symbols_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [pictogramCipherPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "pictogram_cipher_symbols_glyph_id_fk",
      columns: [table.glyphId],
      foreignColumns: [pictogramGlyphs.id],
    }),
    check(
      "pictogram_cipher_symbols_word_index_check",
      sql`${table.wordIndex} >= 0`,
    ),
    check(
      "pictogram_cipher_symbols_position_check",
      sql`${table.position} >= 0`,
    ),
  ],
);

/** Glyphs whose letter the player is told up front. */
export const pictogramCipherGivenGlyphs = pgTable(
  "pictogram_cipher_given_glyphs",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    glyphId: smallint("glyph_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "pictogram_cipher_given_glyphs_pkey",
      columns: [table.puzzleId, table.glyphId],
    }),
    foreignKey({
      name: "pictogram_cipher_given_glyphs_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [pictogramCipherPuzzles.puzzleId],
    }).onDelete("cascade"),
    foreignKey({
      name: "pictogram_cipher_given_glyphs_glyph_id_fk",
      columns: [table.glyphId],
      foreignColumns: [pictogramGlyphs.id],
    }),
  ],
);

export const pictogramCipherAttempts = pgTable(
  "pictogram_cipher_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'pictogram-cipher'`),
  },
  (table) => [
    foreignKey({
      name: "pictogram_cipher_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const pictogramCipherAttemptGuesses = pgTable(
  "pictogram_cipher_attempt_guesses",
  {
    attemptId: uuid("attempt_id").notNull(),
    glyphId: smallint("glyph_id").notNull(),
    letter: char("letter", { length: 1 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "pictogram_cipher_attempt_guesses_pkey",
      columns: [table.attemptId, table.glyphId],
    }),
    foreignKey({
      name: "pictogram_cipher_attempt_guesses_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [pictogramCipherAttempts.attemptId],
    }).onDelete("cascade"),
    foreignKey({
      name: "pictogram_cipher_attempt_guesses_glyph_id_fk",
      columns: [table.glyphId],
      foreignColumns: [pictogramGlyphs.id],
    }),
    check(
      "pictogram_cipher_attempt_guesses_letter_check",
      sql`${table.letter} ~ '^[a-z]$'`,
    ),
  ],
);
