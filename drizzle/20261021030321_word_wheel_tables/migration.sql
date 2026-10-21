CREATE TABLE "word_wheel_attempt_words" (
	"attempt_id" uuid,
	"word" text,
	CONSTRAINT "word_wheel_attempt_words_pkey" PRIMARY KEY("attempt_id","word")
);
--> statement-breakpoint
CREATE TABLE "word_wheel_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-wheel') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_wheel_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-wheel') STORED NOT NULL,
	"target_word" text NOT NULL,
	"centre_position" smallint NOT NULL,
	"scramble_seed" integer NOT NULL,
	"min_length" smallint NOT NULL,
	CONSTRAINT "word_wheel_puzzles_target_word_check" CHECK (length("target_word") = 9),
	CONSTRAINT "word_wheel_puzzles_centre_position_check" CHECK ("centre_position" between 0 and 8),
	CONSTRAINT "word_wheel_puzzles_scramble_seed_check" CHECK ("scramble_seed" >= 0),
	CONSTRAINT "word_wheel_puzzles_min_length_check" CHECK ("min_length" between 4 and 5)
);
--> statement-breakpoint
ALTER TABLE "word_wheel_attempt_words" ADD CONSTRAINT "word_wheel_attempt_words_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "word_wheel_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_wheel_attempt_words" ADD CONSTRAINT "word_wheel_attempt_words_word_fk" FOREIGN KEY ("word") REFERENCES "words"("word");--> statement-breakpoint
ALTER TABLE "word_wheel_attempts" ADD CONSTRAINT "word_wheel_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_wheel_puzzles" ADD CONSTRAINT "word_wheel_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_wheel_puzzles" ADD CONSTRAINT "word_wheel_puzzles_target_word_fk" FOREIGN KEY ("target_word") REFERENCES "words"("word");--> statement-breakpoint
ALTER TABLE "words" DROP CONSTRAINT "words_word_check", ADD CONSTRAINT "words_word_check" CHECK ("word" ~ '^[a-z]{3,9}$');