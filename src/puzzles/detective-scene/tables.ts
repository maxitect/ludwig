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

export const detectiveScenePuzzles = pgTable(
  "detective_scene_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'detective-scene'`),
    sceneKey: text("scene_key").notNull(),
    width: smallint("width").notNull(),
    height: smallint("height").notNull(),
  },
  (table) => [
    foreignKey({
      name: "detective_scene_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    unique("detective_scene_puzzles_scene_key_unique").on(table.sceneKey),
    check(
      "detective_scene_puzzles_scene_key_check",
      sql`${table.sceneKey} <> ''`,
    ),
    check(
      "detective_scene_puzzles_size_check",
      sql`${table.width} > 0 and ${table.height} > 0`,
    ),
  ],
);

export const detectiveSceneItems = pgTable(
  "detective_scene_items",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    title: text("title").notNull(),
    x: smallint("x").notNull(),
    y: smallint("y").notNull(),
    width: smallint("width").notNull(),
    height: smallint("height").notNull(),
  },
  (table) => [
    primaryKey({
      name: "detective_scene_items_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "detective_scene_items_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [detectiveScenePuzzles.puzzleId],
    }).onDelete("cascade"),
    check(
      "detective_scene_items_position_check",
      sql`${table.position} between 0 and 49`,
    ),
    check("detective_scene_items_title_check", sql`${table.title} <> ''`),
    check(
      "detective_scene_items_origin_check",
      sql`${table.x} >= 0 and ${table.y} >= 0`,
    ),
    check(
      "detective_scene_items_size_check",
      sql`${table.width} > 0 and ${table.height} > 0`,
    ),
  ],
);

export const detectiveSceneItemAliases = pgTable(
  "detective_scene_item_aliases",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    alias: text("alias").notNull(),
  },
  (table) => [
    primaryKey({
      name: "detective_scene_item_aliases_pkey",
      columns: [table.puzzleId, table.position, table.alias],
    }),
    foreignKey({
      name: "detective_scene_item_aliases_item_fk",
      columns: [table.puzzleId, table.position],
      foreignColumns: [
        detectiveSceneItems.puzzleId,
        detectiveSceneItems.position,
      ],
    }).onDelete("cascade"),
    check(
      "detective_scene_item_aliases_alias_check",
      sql`${table.alias} <> ''`,
    ),
  ],
);

export const detectiveSceneAttempts = pgTable(
  "detective_scene_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'detective-scene'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "detective_scene_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("detective_scene_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const detectiveSceneAttemptFound = pgTable(
  "detective_scene_attempt_found",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    position: smallint("position").notNull(),
  },
  (table) => [
    primaryKey({
      name: "detective_scene_attempt_found_pkey",
      columns: [table.attemptId, table.position],
    }),
    foreignKey({
      name: "detective_scene_attempt_found_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        detectiveSceneAttempts.attemptId,
        detectiveSceneAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "detective_scene_attempt_found_item_fk",
      columns: [table.puzzleId, table.position],
      foreignColumns: [
        detectiveSceneItems.puzzleId,
        detectiveSceneItems.position,
      ],
    }),
  ],
);
