CREATE TABLE "sudoku_attempt_cells" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "sudoku_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "sudoku_attempt_cells_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_attempt_cells_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "sudoku_attempt_cells_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "sudoku_attempt_notes" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint,
	CONSTRAINT "sudoku_attempt_notes_pkey" PRIMARY KEY("attempt_id","row","col","digit"),
	CONSTRAINT "sudoku_attempt_notes_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_attempt_notes_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "sudoku_attempt_notes_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "sudoku_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('sudoku') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sudoku_givens" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "sudoku_givens_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "sudoku_givens_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_givens_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "sudoku_givens_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "sudoku_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('sudoku') STORED NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sudoku_attempt_cells" ADD CONSTRAINT "sudoku_attempt_cells_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "sudoku_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_attempt_notes" ADD CONSTRAINT "sudoku_attempt_notes_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "sudoku_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_attempts" ADD CONSTRAINT "sudoku_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_givens" ADD CONSTRAINT "sudoku_givens_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_puzzles" ADD CONSTRAINT "sudoku_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;