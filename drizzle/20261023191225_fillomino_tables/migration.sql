CREATE TABLE "fillomino_attempt_cells" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "fillomino_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "fillomino_attempt_cells_row_check" CHECK ("row" between 0 and 11),
	CONSTRAINT "fillomino_attempt_cells_col_check" CHECK ("col" between 0 and 11),
	CONSTRAINT "fillomino_attempt_cells_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "fillomino_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('fillomino') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fillomino_givens" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "fillomino_givens_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "fillomino_givens_row_check" CHECK ("row" between 0 and 11),
	CONSTRAINT "fillomino_givens_col_check" CHECK ("col" between 0 and 11),
	CONSTRAINT "fillomino_givens_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "fillomino_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('fillomino') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "fillomino_puzzles_rows_check" CHECK ("rows" between 5 and 12),
	CONSTRAINT "fillomino_puzzles_cols_check" CHECK ("cols" between 5 and 12)
);
--> statement-breakpoint
ALTER TABLE "fillomino_attempt_cells" ADD CONSTRAINT "fillomino_attempt_cells_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "fillomino_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fillomino_attempts" ADD CONSTRAINT "fillomino_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fillomino_givens" ADD CONSTRAINT "fillomino_givens_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "fillomino_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fillomino_puzzles" ADD CONSTRAINT "fillomino_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;