import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const napkinMathsPuzzles = pgTable(
  "napkin_maths_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'napkin-maths'`),
    questionText: text("question_text").notNull(),
    answer: numeric("answer", { precision: 18, scale: 6 }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "napkin_maths_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "napkin_maths_puzzles_question_text_check",
      sql`char_length(${table.questionText}) between 1 and 300`,
    ),
  ],
);

export const napkinMathsLines = pgTable(
  "napkin_maths_lines",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    content: text("content").notNull(),
  },
  (table) => [
    primaryKey({
      name: "napkin_maths_lines_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "napkin_maths_lines_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [napkinMathsPuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "napkin_maths_lines_position_check",
      sql`${table.position} between 0 and 11`,
    ),
    check(
      "napkin_maths_lines_content_check",
      sql`char_length(${table.content}) between 1 and 120`,
    ),
  ],
);

export const napkinMathsAttempts = pgTable(
  "napkin_maths_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'napkin-maths'`),
    answer: numeric("answer", { precision: 18, scale: 6 }),
  },
  (table) => [
    foreignKey({
      name: "napkin_maths_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);
