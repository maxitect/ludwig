CREATE TYPE "clue_direction" AS ENUM('across', 'down');--> statement-breakpoint
CREATE TYPE "crossword_style" AS ENUM('cryptic', 'quick');--> statement-breakpoint
CREATE TABLE "crossword_attempt_cells" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"row" smallint,
	"col" smallint,
	"letter" char(1) NOT NULL,
	CONSTRAINT "crossword_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "crossword_attempt_cells_letter_check" CHECK ("letter" ~ '^[A-Z]$')
);
--> statement-breakpoint
CREATE TABLE "crossword_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('crossword') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	CONSTRAINT "crossword_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "crossword_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"letter" char(1) NOT NULL,
	CONSTRAINT "crossword_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "crossword_cells_row_check" CHECK ("row" >= 0),
	CONSTRAINT "crossword_cells_col_check" CHECK ("col" >= 0),
	CONSTRAINT "crossword_cells_letter_check" CHECK ("letter" ~ '^[A-Z]$')
);
--> statement-breakpoint
CREATE TABLE "crossword_clue_segments" (
	"puzzle_id" uuid,
	"direction" "clue_direction",
	"row" smallint,
	"col" smallint,
	"position" smallint,
	"length" smallint NOT NULL,
	CONSTRAINT "crossword_clue_segments_pkey" PRIMARY KEY("puzzle_id","direction","row","col","position"),
	CONSTRAINT "crossword_clue_segments_position_check" CHECK ("position" >= 0),
	CONSTRAINT "crossword_clue_segments_length_check" CHECK ("length" >= 1)
);
--> statement-breakpoint
CREATE TABLE "crossword_clues" (
	"puzzle_id" uuid,
	"direction" "clue_direction",
	"row" smallint,
	"col" smallint,
	"clue_text" text NOT NULL,
	CONSTRAINT "crossword_clues_pkey" PRIMARY KEY("puzzle_id","direction","row","col")
);
--> statement-breakpoint
CREATE TABLE "crossword_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('crossword') STORED NOT NULL,
	"style" "crossword_style" NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "crossword_puzzles_rows_check" CHECK ("rows" between 2 and 21),
	CONSTRAINT "crossword_puzzles_cols_check" CHECK ("cols" between 2 and 21)
);
--> statement-breakpoint
ALTER TABLE "crossword_attempt_cells" ADD CONSTRAINT "crossword_attempt_cells_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "crossword_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crossword_attempt_cells" ADD CONSTRAINT "crossword_attempt_cells_cell_fk" FOREIGN KEY ("puzzle_id","row","col") REFERENCES "crossword_cells"("puzzle_id","row","col") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "crossword_attempts" ADD CONSTRAINT "crossword_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crossword_cells" ADD CONSTRAINT "crossword_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "crossword_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crossword_clue_segments" ADD CONSTRAINT "crossword_clue_segments_clue_fk" FOREIGN KEY ("puzzle_id","direction","row","col") REFERENCES "crossword_clues"("puzzle_id","direction","row","col") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crossword_clues" ADD CONSTRAINT "crossword_clues_start_cell_fk" FOREIGN KEY ("puzzle_id","row","col") REFERENCES "crossword_cells"("puzzle_id","row","col") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crossword_puzzles" ADD CONSTRAINT "crossword_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;