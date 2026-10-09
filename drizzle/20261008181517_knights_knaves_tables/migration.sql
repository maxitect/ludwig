CREATE TYPE "kk_role" AS ENUM('knight', 'knave');--> statement-breakpoint
CREATE TABLE "knights_knaves_attempt_roles" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"character_position" smallint,
	"role" "kk_role" NOT NULL,
	CONSTRAINT "knights_knaves_attempt_roles_pkey" PRIMARY KEY("attempt_id","character_position")
);
--> statement-breakpoint
CREATE TABLE "knights_knaves_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('knights-knaves') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	CONSTRAINT "knights_knaves_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "knights_knaves_characters" (
	"puzzle_id" uuid,
	"position" smallint,
	"name" text NOT NULL,
	"role" "kk_role" NOT NULL,
	CONSTRAINT "knights_knaves_characters_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "knights_knaves_characters_puzzle_id_name_unique" UNIQUE("puzzle_id","name") DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "knights_knaves_characters_position_check" CHECK ("position" between 0 and 4),
	CONSTRAINT "knights_knaves_characters_name_check" CHECK (char_length("name") between 1 and 30)
);
--> statement-breakpoint
CREATE TABLE "knights_knaves_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('knights-knaves') STORED NOT NULL,
	"question_text" text NOT NULL,
	CONSTRAINT "knights_knaves_puzzles_question_text_check" CHECK (char_length("question_text") between 1 and 300)
);
--> statement-breakpoint
CREATE TABLE "knights_knaves_statements" (
	"puzzle_id" uuid,
	"character_position" smallint,
	"position" smallint,
	"content" text NOT NULL,
	CONSTRAINT "knights_knaves_statements_pkey" PRIMARY KEY("puzzle_id","character_position","position"),
	CONSTRAINT "knights_knaves_statements_position_check" CHECK ("position" >= 0),
	CONSTRAINT "knights_knaves_statements_content_check" CHECK (char_length("content") between 1 and 300)
);
--> statement-breakpoint
ALTER TABLE "knights_knaves_attempt_roles" ADD CONSTRAINT "knights_knaves_attempt_roles_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "knights_knaves_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knights_knaves_attempt_roles" ADD CONSTRAINT "knights_knaves_attempt_roles_character_fk" FOREIGN KEY ("puzzle_id","character_position") REFERENCES "knights_knaves_characters"("puzzle_id","position") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "knights_knaves_attempts" ADD CONSTRAINT "knights_knaves_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knights_knaves_characters" ADD CONSTRAINT "knights_knaves_characters_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "knights_knaves_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knights_knaves_puzzles" ADD CONSTRAINT "knights_knaves_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knights_knaves_statements" ADD CONSTRAINT "knights_knaves_statements_character_fk" FOREIGN KEY ("puzzle_id","character_position") REFERENCES "knights_knaves_characters"("puzzle_id","position") ON DELETE CASCADE;