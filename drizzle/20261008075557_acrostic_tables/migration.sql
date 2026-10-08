CREATE TYPE "acrostic_rule" AS ENUM('first_letter_line', 'first_letter_word', 'last_letter_line');--> statement-breakpoint
CREATE TABLE "acrostic_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('acrostic') STORED NOT NULL,
	"answer" text,
	CONSTRAINT "acrostic_attempts_answer_check" CHECK (char_length("answer") <= 80)
);
--> statement-breakpoint
CREATE TABLE "acrostic_lines" (
	"puzzle_id" uuid,
	"position" smallint,
	"content" text NOT NULL,
	CONSTRAINT "acrostic_lines_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "acrostic_lines_position_check" CHECK ("position" >= 0),
	CONSTRAINT "acrostic_lines_content_check" CHECK (char_length("content") between 1 and 300 and "content" ~ '[[:alpha:]]')
);
--> statement-breakpoint
CREATE TABLE "acrostic_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('acrostic') STORED NOT NULL,
	"rule" "acrostic_rule" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acrostic_attempts" ADD CONSTRAINT "acrostic_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "acrostic_lines" ADD CONSTRAINT "acrostic_lines_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "acrostic_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "acrostic_puzzles" ADD CONSTRAINT "acrostic_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;