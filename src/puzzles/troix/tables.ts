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

export const troixSymbolEnum = pgEnum("troix_symbol", ["x", "o", "i"]);

export const troixPuzzles = pgTable(
  "troix_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'troix'`),
    size: smallint("size").notNull(),
  },
  (table) => [
    foreignKey({
      name: "troix_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("troix_puzzles_size_check", sql`${table.size} in (6, 9)`),
  ],
);

export const troixGivens = pgTable(
  "troix_givens",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    symbol: troixSymbolEnum("symbol").notNull(),
  },
  (table) => [
    primaryKey({
      name: "troix_givens_pkey",
      columns: [table.puzzleId, table.row, table.col],
    }),
    foreignKey({
      name: "troix_givens_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [troixPuzzles.puzzleId],
    }).onDelete("cascade"),
    check("troix_givens_row_check", sql`${table.row} between 0 and 8`),
    check("troix_givens_col_check", sql`${table.col} between 0 and 8`),
  ],
);

export const troixAttempts = pgTable(
  "troix_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'troix'`),
  },
  (table) => [
    foreignKey({
      name: "troix_attempts_attempt_id_type_key_fk",
      columns: [table.attemptId, table.typeKey],
      foreignColumns: [attempts.id, attempts.typeKey],
    }).onDelete("cascade"),
  ],
);

export const troixAttemptCells = pgTable(
  "troix_attempt_cells",
  {
    attemptId: uuid("attempt_id").notNull(),
    row: smallint("row").notNull(),
    col: smallint("col").notNull(),
    symbol: troixSymbolEnum("symbol").notNull(),
  },
  (table) => [
    primaryKey({
      name: "troix_attempt_cells_pkey",
      columns: [table.attemptId, table.row, table.col],
    }),
    foreignKey({
      name: "troix_attempt_cells_attempt_id_fk",
      columns: [table.attemptId],
      foreignColumns: [troixAttempts.attemptId],
    }).onDelete("cascade"),
    check("troix_attempt_cells_row_check", sql`${table.row} between 0 and 8`),
    check("troix_attempt_cells_col_check", sql`${table.col} between 0 and 8`),
  ],
);
