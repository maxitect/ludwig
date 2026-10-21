CREATE TYPE "track_piece" AS ENUM('ns', 'ew', 'ne', 'nw', 'se', 'sw');--> statement-breakpoint
CREATE TABLE "railroad_attempt_crosses" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "railroad_attempt_crosses_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "railroad_attempt_crosses_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "railroad_attempt_crosses_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "railroad_attempt_pieces" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"piece" "track_piece" NOT NULL,
	CONSTRAINT "railroad_attempt_pieces_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "railroad_attempt_pieces_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "railroad_attempt_pieces_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "railroad_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('railroad') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "railroad_col_counts" (
	"puzzle_id" uuid,
	"col" smallint,
	"count" smallint NOT NULL,
	CONSTRAINT "railroad_col_counts_pkey" PRIMARY KEY("puzzle_id","col"),
	CONSTRAINT "railroad_col_counts_col_check" CHECK ("col" between 0 and 9),
	CONSTRAINT "railroad_col_counts_count_check" CHECK ("count" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "railroad_given_pieces" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"piece" "track_piece" NOT NULL,
	CONSTRAINT "railroad_given_pieces_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "railroad_given_pieces_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "railroad_given_pieces_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "railroad_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('railroad') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	"entry_row" smallint NOT NULL,
	"entry_col" smallint NOT NULL,
	"entry_side" "compass8" NOT NULL,
	"exit_row" smallint NOT NULL,
	"exit_col" smallint NOT NULL,
	"exit_side" "compass8" NOT NULL,
	CONSTRAINT "railroad_puzzles_rows_check" CHECK ("rows" between 4 and 10),
	CONSTRAINT "railroad_puzzles_cols_check" CHECK ("cols" between 4 and 10),
	CONSTRAINT "railroad_puzzles_entry_row_check" CHECK ("entry_row" between 0 and "rows" - 1),
	CONSTRAINT "railroad_puzzles_entry_col_check" CHECK ("entry_col" between 0 and "cols" - 1),
	CONSTRAINT "railroad_puzzles_exit_row_check" CHECK ("exit_row" between 0 and "rows" - 1),
	CONSTRAINT "railroad_puzzles_exit_col_check" CHECK ("exit_col" between 0 and "cols" - 1),
	CONSTRAINT "railroad_puzzles_entry_side_check" CHECK ("entry_side" in ('n', 'e', 's', 'w')),
	CONSTRAINT "railroad_puzzles_exit_side_check" CHECK ("exit_side" in ('n', 'e', 's', 'w'))
);
--> statement-breakpoint
CREATE TABLE "railroad_row_counts" (
	"puzzle_id" uuid,
	"row" smallint,
	"count" smallint NOT NULL,
	CONSTRAINT "railroad_row_counts_pkey" PRIMARY KEY("puzzle_id","row"),
	CONSTRAINT "railroad_row_counts_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "railroad_row_counts_count_check" CHECK ("count" between 0 and 10)
);
--> statement-breakpoint
ALTER TABLE "railroad_attempt_crosses" ADD CONSTRAINT "railroad_attempt_crosses_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "railroad_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_attempt_pieces" ADD CONSTRAINT "railroad_attempt_pieces_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "railroad_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_attempts" ADD CONSTRAINT "railroad_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_col_counts" ADD CONSTRAINT "railroad_col_counts_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "railroad_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_given_pieces" ADD CONSTRAINT "railroad_given_pieces_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "railroad_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_puzzles" ADD CONSTRAINT "railroad_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "railroad_row_counts" ADD CONSTRAINT "railroad_row_counts_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "railroad_puzzles"("puzzle_id") ON DELETE CASCADE;