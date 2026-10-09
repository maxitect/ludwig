CREATE TABLE "napkin_maths_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('napkin-maths') STORED NOT NULL,
	"answer" numeric(18,6)
);
--> statement-breakpoint
CREATE TABLE "napkin_maths_lines" (
	"puzzle_id" uuid,
	"position" smallint,
	"content" text NOT NULL,
	CONSTRAINT "napkin_maths_lines_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "napkin_maths_lines_position_check" CHECK ("position" between 0 and 11),
	CONSTRAINT "napkin_maths_lines_content_check" CHECK (char_length("content") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "napkin_maths_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('napkin-maths') STORED NOT NULL,
	"question_text" text NOT NULL,
	"answer" numeric(18,6) NOT NULL,
	CONSTRAINT "napkin_maths_puzzles_question_text_check" CHECK (char_length("question_text") between 1 and 300)
);
--> statement-breakpoint
ALTER TABLE "napkin_maths_attempts" ADD CONSTRAINT "napkin_maths_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "napkin_maths_lines" ADD CONSTRAINT "napkin_maths_lines_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "napkin_maths_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "napkin_maths_puzzles" ADD CONSTRAINT "napkin_maths_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;