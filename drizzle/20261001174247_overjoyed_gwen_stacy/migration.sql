CREATE TYPE "book_cover" AS ENUM('blue', 'red', 'ink');--> statement-breakpoint
CREATE TYPE "chess_notation" AS ENUM('algebraic', 'descriptive');--> statement-breakpoint
CREATE TYPE "theme" AS ENUM('paper', 'ink', 'system');--> statement-breakpoint
CREATE TYPE "weekly_slot" AS ENUM('first', 'second');--> statement-breakpoint
CREATE TYPE "hint_kind" AS ENUM('check_cell', 'reveal_cell', 'check_all', 'reveal_all');--> statement-breakpoint
CREATE TABLE "puzzle_categories" (
	"key" text PRIMARY KEY,
	"name" text NOT NULL,
	"sort" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzle_types" (
	"key" text PRIMARY KEY,
	"category_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"subtype_table" text NOT NULL UNIQUE,
	"sort" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"type_key" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" smallint NOT NULL,
	"volume_id" uuid,
	"source_note" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puzzles_type_key_slug_unique" UNIQUE("type_key","slug"),
	CONSTRAINT "puzzles_id_type_key_unique" UNIQUE("id","type_key"),
	CONSTRAINT "puzzles_difficulty_check" CHECK ("difficulty" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY,
	"theme" "theme" DEFAULT 'system'::"theme" NOT NULL,
	"chess_notation" "chess_notation" DEFAULT 'algebraic'::"chess_notation" NOT NULL,
	"reduce_motion" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volumes" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"cover" "book_cover" NOT NULL,
	"sort" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_puzzles" (
	"week_start" date,
	"slot" "weekly_slot",
	"puzzle_id" uuid NOT NULL,
	CONSTRAINT "weekly_puzzles_pkey" PRIMARY KEY("week_start","slot"),
	CONSTRAINT "weekly_puzzles_week_start_puzzle_id_unique" UNIQUE("week_start","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "attempt_hints" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"attempt_id" uuid NOT NULL,
	"kind" "hint_kind" NOT NULL,
	"row" smallint,
	"col" smallint,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_hints_row_check" CHECK ("row" >= 0),
	CONSTRAINT "attempt_hints_col_check" CHECK ("col" >= 0)
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"type_key" text DEFAULT NULL NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	CONSTRAINT "attempts_user_id_puzzle_id_unique" UNIQUE("user_id","puzzle_id"),
	CONSTRAINT "attempts_id_puzzle_id_type_key_unique" UNIQUE("id","puzzle_id","type_key")
);
--> statement-breakpoint
ALTER TABLE "puzzle_types" ADD CONSTRAINT "puzzle_types_category_key_puzzle_categories_key_fkey" FOREIGN KEY ("category_key") REFERENCES "puzzle_categories"("key");--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_type_key_puzzle_types_key_fkey" FOREIGN KEY ("type_key") REFERENCES "puzzle_types"("key");--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_volume_id_volumes_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id");--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "weekly_puzzles" ADD CONSTRAINT "weekly_puzzles_puzzle_id_puzzles_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempt_hints" ADD CONSTRAINT "attempt_hints_attempt_id_attempts_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;