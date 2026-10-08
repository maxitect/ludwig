import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { puzzles } from "../../db/schema/core";
import { attempts } from "../../db/schema/progress";

export const kkRoleEnum = pgEnum("kk_role", ["knight", "knave"]);

export const knightsKnavesPuzzles = pgTable(
  "knights_knaves_puzzles",
  {
    puzzleId: uuid("puzzle_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'knights-knaves'`),
    questionText: text("question_text").notNull(),
  },
  (table) => [
    foreignKey({
      name: "knights_knaves_puzzles_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
    check(
      "knights_knaves_puzzles_question_text_check",
      sql`char_length(${table.questionText}) between 1 and 300`,
    ),
  ],
);

export const knightsKnavesCharacters = pgTable(
  "knights_knaves_characters",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    position: smallint("position").notNull(),
    name: text("name").notNull(),
    role: kkRoleEnum("role").notNull(),
  },
  (table) => [
    primaryKey({
      name: "knights_knaves_characters_pkey",
      columns: [table.puzzleId, table.position],
    }),
    foreignKey({
      name: "knights_knaves_characters_puzzle_id_fk",
      columns: [table.puzzleId],
      foreignColumns: [knightsKnavesPuzzles.puzzleId],
    }).onDelete("cascade"),
    unique("knights_knaves_characters_puzzle_id_name_unique").on(
      table.puzzleId,
      table.name,
    ),
    check(
      "knights_knaves_characters_position_check",
      sql`${table.position} between 0 and 4`,
    ),
    check(
      "knights_knaves_characters_name_check",
      sql`char_length(${table.name}) between 1 and 30`,
    ),
  ],
);

export const knightsKnavesStatements = pgTable(
  "knights_knaves_statements",
  {
    puzzleId: uuid("puzzle_id").notNull(),
    characterPosition: smallint("character_position").notNull(),
    position: smallint("position").notNull(),
    content: text("content").notNull(),
  },
  (table) => [
    primaryKey({
      name: "knights_knaves_statements_pkey",
      columns: [table.puzzleId, table.characterPosition, table.position],
    }),
    foreignKey({
      name: "knights_knaves_statements_character_fk",
      columns: [table.puzzleId, table.characterPosition],
      foreignColumns: [
        knightsKnavesCharacters.puzzleId,
        knightsKnavesCharacters.position,
      ],
    }).onDelete("cascade"),
    check(
      "knights_knaves_statements_position_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "knights_knaves_statements_content_check",
      sql`char_length(${table.content}) between 1 and 300`,
    ),
  ],
);

export const knightsKnavesAttempts = pgTable(
  "knights_knaves_attempts",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    typeKey: text("type_key")
      .notNull()
      .generatedAlwaysAs(sql`'knights-knaves'`),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
  },
  (table) => [
    foreignKey({
      name: "knights_knaves_attempts_attempt_id_puzzle_id_type_key_fk",
      columns: [table.attemptId, table.puzzleId, table.typeKey],
      foreignColumns: [attempts.id, attempts.puzzleId, attempts.typeKey],
    }).onDelete("cascade"),
    unique("knights_knaves_attempts_attempt_id_puzzle_id_unique").on(
      table.attemptId,
      table.puzzleId,
    ),
  ],
);

export const knightsKnavesAttemptRoles = pgTable(
  "knights_knaves_attempt_roles",
  {
    attemptId: uuid("attempt_id").notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .default(sql`NULL`),
    characterPosition: smallint("character_position").notNull(),
    role: kkRoleEnum("role").notNull(),
  },
  (table) => [
    primaryKey({
      name: "knights_knaves_attempt_roles_pkey",
      columns: [table.attemptId, table.characterPosition],
    }),
    foreignKey({
      name: "knights_knaves_attempt_roles_attempt_id_puzzle_id_fk",
      columns: [table.attemptId, table.puzzleId],
      foreignColumns: [
        knightsKnavesAttempts.attemptId,
        knightsKnavesAttempts.puzzleId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "knights_knaves_attempt_roles_character_fk",
      columns: [table.puzzleId, table.characterPosition],
      foreignColumns: [
        knightsKnavesCharacters.puzzleId,
        knightsKnavesCharacters.position,
      ],
    }),
  ],
);
