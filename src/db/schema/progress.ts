import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { puzzles } from "./core";

export const hintKindEnum = pgEnum("hint_kind", [
  "check_cell",
  "reveal_cell",
  "check_all",
  "reveal_all",
]);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    puzzleId: uuid("puzzle_id").notNull(),
    typeKey: text("type_key")
      .notNull()
      .default(sql`NULL`),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
  },
  (table) => [
    unique("attempts_user_id_puzzle_id_unique").on(
      table.userId,
      table.puzzleId,
    ),
    unique("attempts_id_puzzle_id_type_key_unique").on(
      table.id,
      table.puzzleId,
      table.typeKey,
    ),
    foreignKey({
      name: "attempts_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const attemptHints = pgTable(
  "attempt_hints",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    kind: hintKindEnum("kind").notNull(),
    row: smallint("row"),
    col: smallint("col"),
    usedAt: timestamp("used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("attempt_hints_row_check", sql`${table.row} >= 0`),
    check("attempt_hints_col_check", sql`${table.col} >= 0`),
  ],
);
