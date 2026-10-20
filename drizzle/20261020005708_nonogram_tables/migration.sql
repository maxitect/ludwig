CREATE TYPE "nonogram_mark" AS ENUM('fill', 'cross');--> statement-breakpoint
CREATE TABLE "nonogram_attempt_marks" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"mark" "nonogram_mark" NOT NULL,
	CONSTRAINT "nonogram_attempt_marks_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "nonogram_attempt_marks_row_check" CHECK ("row" between 0 and 24),
	CONSTRAINT "nonogram_attempt_marks_col_check" CHECK ("col" between 0 and 24)
);
--> statement-breakpoint
CREATE TABLE "nonogram_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('nonogram') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nonogram_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "nonogram_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "nonogram_cells_row_check" CHECK ("row" between 0 and 24),
	CONSTRAINT "nonogram_cells_col_check" CHECK ("col" between 0 and 24)
);
--> statement-breakpoint
CREATE TABLE "nonogram_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('nonogram') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	"caption" text NOT NULL,
	CONSTRAINT "nonogram_puzzles_rows_check" CHECK ("rows" between 5 and 25),
	CONSTRAINT "nonogram_puzzles_cols_check" CHECK ("cols" between 5 and 25)
);
--> statement-breakpoint
ALTER TABLE "nonogram_attempt_marks" ADD CONSTRAINT "nonogram_attempt_marks_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "nonogram_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nonogram_attempts" ADD CONSTRAINT "nonogram_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nonogram_cells" ADD CONSTRAINT "nonogram_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "nonogram_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nonogram_puzzles" ADD CONSTRAINT "nonogram_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;