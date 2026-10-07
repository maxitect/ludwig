CREATE TYPE "ineq_direction" AS ENUM('right', 'down');--> statement-breakpoint
CREATE TYPE "ineq_relation" AS ENUM('lt', 'gt');--> statement-breakpoint
CREATE TABLE "futoshiki_attempt_cells" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "futoshiki_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "futoshiki_attempt_cells_row_check" CHECK ("row" between 0 and 6),
	CONSTRAINT "futoshiki_attempt_cells_col_check" CHECK ("col" between 0 and 6),
	CONSTRAINT "futoshiki_attempt_cells_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "futoshiki_attempt_notes" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint,
	CONSTRAINT "futoshiki_attempt_notes_pkey" PRIMARY KEY("attempt_id","row","col","digit"),
	CONSTRAINT "futoshiki_attempt_notes_row_check" CHECK ("row" between 0 and 6),
	CONSTRAINT "futoshiki_attempt_notes_col_check" CHECK ("col" between 0 and 6),
	CONSTRAINT "futoshiki_attempt_notes_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "futoshiki_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('futoshiki') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "futoshiki_givens" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "futoshiki_givens_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "futoshiki_givens_row_check" CHECK ("row" between 0 and 6),
	CONSTRAINT "futoshiki_givens_col_check" CHECK ("col" between 0 and 6),
	CONSTRAINT "futoshiki_givens_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "futoshiki_inequalities" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"direction" "ineq_direction",
	"relation" "ineq_relation" NOT NULL,
	CONSTRAINT "futoshiki_inequalities_pkey" PRIMARY KEY("puzzle_id","row","col","direction"),
	CONSTRAINT "futoshiki_inequalities_row_check" CHECK ("row" between 0 and 6),
	CONSTRAINT "futoshiki_inequalities_col_check" CHECK ("col" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "futoshiki_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('futoshiki') STORED NOT NULL,
	"size" smallint NOT NULL,
	CONSTRAINT "futoshiki_puzzles_size_check" CHECK ("size" between 4 and 7)
);
--> statement-breakpoint
ALTER TABLE "futoshiki_attempt_cells" ADD CONSTRAINT "futoshiki_attempt_cells_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "futoshiki_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "futoshiki_attempt_notes" ADD CONSTRAINT "futoshiki_attempt_notes_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "futoshiki_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "futoshiki_attempts" ADD CONSTRAINT "futoshiki_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "futoshiki_givens" ADD CONSTRAINT "futoshiki_givens_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "futoshiki_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "futoshiki_inequalities" ADD CONSTRAINT "futoshiki_inequalities_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "futoshiki_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "futoshiki_puzzles" ADD CONSTRAINT "futoshiki_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;