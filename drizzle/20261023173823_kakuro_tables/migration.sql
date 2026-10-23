CREATE TABLE "kakuro_attempt_cells" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "kakuro_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "kakuro_attempt_cells_row_check" CHECK ("row" between 0 and 13),
	CONSTRAINT "kakuro_attempt_cells_col_check" CHECK ("col" between 0 and 13),
	CONSTRAINT "kakuro_attempt_cells_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "kakuro_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('kakuro') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kakuro_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "kakuro_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "kakuro_cells_row_check" CHECK ("row" between 0 and 13),
	CONSTRAINT "kakuro_cells_col_check" CHECK ("col" between 0 and 13),
	CONSTRAINT "kakuro_cells_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "kakuro_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('kakuro') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "kakuro_puzzles_rows_check" CHECK ("rows" between 5 and 14),
	CONSTRAINT "kakuro_puzzles_cols_check" CHECK ("cols" between 5 and 14)
);
--> statement-breakpoint
ALTER TABLE "kakuro_attempt_cells" ADD CONSTRAINT "kakuro_attempt_cells_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "kakuro_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kakuro_attempts" ADD CONSTRAINT "kakuro_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kakuro_cells" ADD CONSTRAINT "kakuro_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "kakuro_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kakuro_puzzles" ADD CONSTRAINT "kakuro_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;