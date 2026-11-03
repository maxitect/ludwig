import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  integer,
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
export const chessFileEnum = pgEnum("chess_file", [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
]);
export const chessPieceEnum = pgEnum("chess_piece", [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
]);
export const chessColourEnum = pgEnum("chess_colour", ["white", "black"]);

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
    volumePosition: integer("volume_position"),
    sourceNote: text("source_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("puzzles_type_key_slug_unique").on(table.typeKey, table.slug),
    unique("puzzles_id_type_key_unique").on(table.id, table.typeKey),
    unique("puzzles_volume_id_volume_position_unique").on(
      table.volumeId,
      table.volumePosition,
    ),
    check("puzzles_difficulty_check", sql`${table.difficulty} between 1 and 5`),
    check(
      "puzzles_volume_position_check",
      sql`(${table.volumeId} is null) = (${table.volumePosition} is null)`,
    ),
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

export const dailyPuzzles = pgTable(
  "daily_puzzles",
  {
    typeKey: text("type_key").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    puzzleId: uuid("puzzle_id").notNull(),
    generatorVersion: smallint("generator_version").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.typeKey, table.date] }),
    unique("daily_puzzles_puzzle_id_unique").on(table.puzzleId),
    foreignKey({
      name: "daily_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check("daily_puzzles_generator_version_check", sql`${table.generatorVersion} > 0`),
  ],
);

export const puzzleInsertSchema = createInsertSchema(puzzles, {
  difficulty: (schema) => schema.min(1).max(5),
  volumePosition: (schema) => schema.min(1).nullish(),
});

export const weeklyPuzzleInsertSchema = createInsertSchema(weeklyPuzzles);
