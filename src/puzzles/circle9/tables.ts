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

export const circle9Puzzles = pgTable(
  "circle9_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'circle9'`),
  },
  (table) => [
    foreignKey({
      name: "circle9_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const circle9Numbers = pgTable(
  "circle9_numbers",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    digit: smallint("digit").notNull(),
  },
  (table) => [
    primaryKey({
      name: "circle9_numbers_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "circle9_numbers_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [circle9Puzzles.puzzleId],
    }).onDelete("cascade"),
    check("circle9_numbers_row_check", sql`${table.row} between 0 and 8`),
    check("circle9_numbers_col_check", sql`${table.col} between 0 and 8`),
    check("circle9_numbers_digit_check", sql`${table.digit} between 1 and 9`),
  ],
);

export const circle9Attempts = pgTable(
  "circle9_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'circle9'`),
  },
  (table) => [
    foreignKey({
      name: "circle9_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const circle9AttemptCircles = pgTable(
  "circle9_attempt_circles",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
  },
  (table) => [
    primaryKey({
      name: "circle9_attempt_circles_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "circle9_attempt_circles_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [circle9Attempts.attemptId],
    }).onDelete("cascade"),
    check("circle9_attempt_circles_row_check", sql`${table.row} between 0 and 8`),
    check("circle9_attempt_circles_col_check", sql`${table.col} between 0 and 8`),
  ],
);
