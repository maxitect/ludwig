CREATE TABLE "word_ladder_attempt_rungs" (
	"attempt_id" uuid,
	"position" smallint,
	"word" text NOT NULL,
	CONSTRAINT "word_ladder_attempt_rungs_pkey" PRIMARY KEY("attempt_id","position"),
	CONSTRAINT "word_ladder_attempt_rungs_position_check" CHECK ("position" >= 0),
	CONSTRAINT "word_ladder_attempt_rungs_word_check" CHECK ("word" ~ '^[a-z]{1,6}$')
);
--> statement-breakpoint
CREATE TABLE "word_ladder_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-ladder') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_ladder_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-ladder') STORED NOT NULL,
	"start_word" text NOT NULL,
	"end_word" text NOT NULL,
	"rung_count" smallint NOT NULL,
	CONSTRAINT "word_ladder_puzzles_rung_count_check" CHECK ("rung_count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "word_ladder_solution_rungs" (
	"puzzle_id" uuid,
	"position" smallint,
	"word" text NOT NULL,
	CONSTRAINT "word_ladder_solution_rungs_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "word_ladder_solution_rungs_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "words" (
	"word" text PRIMARY KEY,
	CONSTRAINT "words_word_check" CHECK ("word" ~ '^[a-z]{3,6}$')
);
--> statement-breakpoint
ALTER TABLE "word_ladder_attempt_rungs" ADD CONSTRAINT "word_ladder_attempt_rungs_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "word_ladder_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_ladder_attempts" ADD CONSTRAINT "word_ladder_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_ladder_puzzles" ADD CONSTRAINT "word_ladder_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_ladder_puzzles" ADD CONSTRAINT "word_ladder_puzzles_start_word_fk" FOREIGN KEY ("start_word") REFERENCES "words"("word");--> statement-breakpoint
ALTER TABLE "word_ladder_puzzles" ADD CONSTRAINT "word_ladder_puzzles_end_word_fk" FOREIGN KEY ("end_word") REFERENCES "words"("word");--> statement-breakpoint
ALTER TABLE "word_ladder_solution_rungs" ADD CONSTRAINT "word_ladder_solution_rungs_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "word_ladder_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_ladder_solution_rungs" ADD CONSTRAINT "word_ladder_solution_rungs_word_fk" FOREIGN KEY ("word") REFERENCES "words"("word");