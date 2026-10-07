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

export const caesarPuzzles = pgTable(
  "caesar_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'caesar'`),
    plaintext: text("plaintext").notNull(),
    shift: integer("shift").notNull(),
  },
  (table) => [
    foreignKey({
      name: "caesar_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("caesar_puzzles_shift_check", sql`${table.shift} between 1 and 25`),
  ],
);

export const caesarAttempts = pgTable(
  "caesar_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'caesar'`),
    answer: text("answer"),
  },
  (table) => [
    foreignKey({
      name: "caesar_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);
