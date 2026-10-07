import { sql } from "drizzle-orm";
import { foreignKey, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const keywordPuzzles = pgTable(
  "keyword_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'keyword'`),
    plaintext: text("plaintext").notNull(),
    keyword: text("keyword").notNull(),
  },
  (table) => [
    foreignKey({
      name: "keyword_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const keywordAttempts = pgTable(
  "keyword_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'keyword'`),
    answer: text("answer"),
  },
  (table) => [
    foreignKey({
      name: "keyword_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);
