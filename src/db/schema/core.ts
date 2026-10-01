import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-orm/zod";
import { user } from "../auth-schema";

export const themeEnum = pgEnum("theme", ["paper", "ink", "system"]);
export const chessNotationEnum = pgEnum("chess_notation", [
  "algebraic",
  "descriptive",
]);
export const bookCoverEnum = pgEnum("book_cover", ["blue", "red", "ink"]);
export const weeklySlotEnum = pgEnum("weekly_slot", ["first", "second"]);

export const puzzleCategories = pgTable("puzzle_categories", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  sort: smallint("sort").notNull(),
});

export const puzzleTypes = pgTable("puzzle_types", {
  key: text("key").primaryKey(),
  categoryKey: text("category_key")
    .notNull()
    .references(() => puzzleCategories.key),
  name: text("name").notNull(),
  description: text("description").notNull(),
  subtypeTable: text("subtype_table").notNull().unique(),
  sort: smallint("sort").notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: themeEnum("theme").notNull().default("system"),
  chessNotation: chessNotationEnum("chess_notation")
    .notNull()
    .default("algebraic"),
  reduceMotion: boolean("reduce_motion").notNull().default(false),
});

export const volumes = pgTable("volumes", {
  id: uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  cover: bookCoverEnum("cover").notNull(),
  sort: smallint("sort").notNull(),
});

export const puzzles = pgTable(
  "puzzles",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .references(() => puzzleTypes.key),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    difficulty: smallint("difficulty").notNull(),
    volumeId: uuid("volume_id").references(() => volumes.id),
    sourceNote: text("source_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("puzzles_type_key_slug_unique").on(table.typeKey, table.slug),
    unique("puzzles_id_type_key_unique").on(table.id, table.typeKey),
    check("puzzles_difficulty_check", sql`${table.difficulty} between 1 and 5`),
  ],
);

export const weeklyPuzzles = pgTable(
  "weekly_puzzles",
  {
    weekStart: date("week_start", { mode: "string" }).notNull(),
    slot: weeklySlotEnum("slot").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.weekStart, table.slot] }),
    unique("weekly_puzzles_week_start_puzzle_id_unique").on(
      table.weekStart,
      table.puzzleId,
    ),
  ],
);

export const puzzleInsertSchema = createInsertSchema(puzzles, {
  difficulty: (schema) => schema.min(1).max(5),
});
