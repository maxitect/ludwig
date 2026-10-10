CREATE TYPE "sudoku_region_kind" AS ENUM('jigsaw', 'rainbow');--> statement-breakpoint
CREATE TABLE "sudoku_region_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"region" smallint NOT NULL,
	CONSTRAINT "sudoku_region_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "sudoku_region_cells_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_region_cells_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "sudoku_region_cells_region_check" CHECK ("region" between 0 and 8)
);
--> statement-breakpoint
CREATE TABLE "sudoku_region_sets" (
	"puzzle_id" uuid PRIMARY KEY,
	"kind" "sudoku_region_kind" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sudoku_region_cells" ADD CONSTRAINT "sudoku_region_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_region_sets"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_region_sets" ADD CONSTRAINT "sudoku_region_sets_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_puzzles"("puzzle_id") ON DELETE CASCADE;