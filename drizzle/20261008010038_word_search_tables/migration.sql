CREATE TABLE "word_search_attempt_found" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"word" text,
	CONSTRAINT "word_search_attempt_found_pkey" PRIMARY KEY("attempt_id","word")
);
--> statement-breakpoint
CREATE TABLE "word_search_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-search') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	CONSTRAINT "word_search_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "word_search_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"letter" char(1) NOT NULL,
	CONSTRAINT "word_search_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "word_search_cells_row_check" CHECK ("row" >= 0),
	CONSTRAINT "word_search_cells_col_check" CHECK ("col" >= 0),
	CONSTRAINT "word_search_cells_letter_check" CHECK ("letter" ~ '^[A-Z]$')
);
--> statement-breakpoint
CREATE TABLE "word_search_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('word-search') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "word_search_puzzles_rows_check" CHECK ("rows" between 3 and 15),
	CONSTRAINT "word_search_puzzles_cols_check" CHECK ("cols" between 3 and 15)
);
--> statement-breakpoint
CREATE TABLE "word_search_words" (
	"puzzle_id" uuid,
	"word" text,
	CONSTRAINT "word_search_words_pkey" PRIMARY KEY("puzzle_id","word"),
	CONSTRAINT "word_search_words_word_check" CHECK ("word" ~ '^[A-Z]{3,15}$')
);
--> statement-breakpoint
ALTER TABLE "word_search_attempt_found" ADD CONSTRAINT "word_search_attempt_found_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "word_search_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_search_attempt_found" ADD CONSTRAINT "word_search_attempt_found_word_fk" FOREIGN KEY ("puzzle_id","word") REFERENCES "word_search_words"("puzzle_id","word") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "word_search_attempts" ADD CONSTRAINT "word_search_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_search_cells" ADD CONSTRAINT "word_search_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "word_search_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_search_puzzles" ADD CONSTRAINT "word_search_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "word_search_words" ADD CONSTRAINT "word_search_words_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "word_search_puzzles"("puzzle_id") ON DELETE CASCADE;