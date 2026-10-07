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

export const bookTexts = pgTable("book_texts", {
  id: uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  source: text("source").notNull(),
  publicDomainBasis: text("public_domain_basis").notNull(),
});

export const bookTextLines = pgTable(
  "book_text_lines",
  {
    textId: uuid("text_id").notNull(),
    page: smallint("page").notNull(),
    line: smallint("line").notNull(),
    content: text("content").notNull(),
  },
  (table) => [
    primaryKey({
      name: "book_text_lines_pkey",
      columns: [table.textId, table.page, table.line],
    }),
    foreignKey({
      name: "book_text_lines_text_id_fk",
      columns: [table.textId],
      foreignColumns: [bookTexts.id],
    }).onDelete("cascade"),
    check("book_text_lines_page_check", sql`${table.page} >= 1`),
    check("book_text_lines_line_check", sql`${table.line} >= 1`),
    check(
      "book_text_lines_content_check",
      sql`length(btrim(${table.content})) > 0`,
    ),
  ],
);

export const bookCipherPuzzles = pgTable(
  "book_cipher_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'book-cipher'`),
    textId: uuid("text_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "book_cipher_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    foreignKey({
      name: "book_cipher_puzzles_text_id_fk",
      columns: [table.textId],
      foreignColumns: [bookTexts.id],
    }),
    unique("book_cipher_puzzles_puzzle_id_text_id_key").on(
      table.puzzleId,
      table.textId,
    ),
  ],
);

/**
 * One page:line:word reference. `text_id` is redundant with the puzzle's, filled by a trigger and
 * held by the composite FKs. The line FK has no cascade, so removing a referenced line fails the seed.
 */
export const bookCipherRefs = pgTable(
  "book_cipher_refs",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    textId: uuid("text_id")
      .notNull()
      .default(sql`NULL`),
    page: smallint("page").notNull(),
    line: smallint("line").notNull(),
    wordIndex: smallint("word_index").notNull(),
  },
  (table) => [
    primaryKey({
      name: "book_cipher_refs_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "book_cipher_refs_puzzle_id_text_id_fk",
      columns: [table.puzzleId, table.textId],
      foreignColumns: [bookCipherPuzzles.puzzleId, bookCipherPuzzles.textId],
    }).onDelete("cascade"),
    foreignKey({
      name: "book_cipher_refs_text_id_page_line_fk",
      columns: [table.textId, table.page, table.line],
      foreignColumns: [
        bookTextLines.textId,
        bookTextLines.page,
        bookTextLines.line,
      ],
    }),
    check("book_cipher_refs_position_check", sql`${table.position} >= 0`),
    check("book_cipher_refs_word_index_check", sql`${table.wordIndex} >= 1`),
  ],
);

export const bookCipherAttempts = pgTable(
  "book_cipher_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'book-cipher'`),
    answer: text("answer"),
  },
  (table) => [
    foreignKey({
      name: "book_cipher_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);
