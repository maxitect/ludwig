CREATE TYPE "xv_mark" AS ENUM('x', 'v');--> statement-breakpoint
CREATE TABLE "sudoku_cage_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"cage" smallint NOT NULL,
	CONSTRAINT "sudoku_cage_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "sudoku_cage_cells_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_cage_cells_col_check" CHECK ("col" between 0 and 8)
);
--> statement-breakpoint
CREATE TABLE "sudoku_cages" (
	"puzzle_id" uuid,
	"cage" smallint,
	"sum" smallint NOT NULL,
	CONSTRAINT "sudoku_cages_pkey" PRIMARY KEY("puzzle_id","cage"),
	CONSTRAINT "sudoku_cages_cage_check" CHECK ("cage" between 0 and 80),
	CONSTRAINT "sudoku_cages_sum_check" CHECK ("sum" between 1 and 45)
);
--> statement-breakpoint
CREATE TABLE "sudoku_xv_marks" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"direction" "ineq_direction",
	"mark" "xv_mark" NOT NULL,
	CONSTRAINT "sudoku_xv_marks_pkey" PRIMARY KEY("puzzle_id","row","col","direction"),
	CONSTRAINT "sudoku_xv_marks_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "sudoku_xv_marks_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "sudoku_xv_marks_inside_check" CHECK (("direction" = 'right' and "col" <= 7) or ("direction" = 'down' and "row" <= 7))
);
--> statement-breakpoint
CREATE TABLE "sudoku_xv_sets" (
	"puzzle_id" uuid PRIMARY KEY
);
--> statement-breakpoint
ALTER TABLE "sudoku_cage_cells" ADD CONSTRAINT "sudoku_cage_cells_cage_fk" FOREIGN KEY ("puzzle_id","cage") REFERENCES "sudoku_cages"("puzzle_id","cage") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_cages" ADD CONSTRAINT "sudoku_cages_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_xv_marks" ADD CONSTRAINT "sudoku_xv_marks_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_xv_sets"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sudoku_xv_sets" ADD CONSTRAINT "sudoku_xv_sets_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sudoku_puzzles"("puzzle_id") ON DELETE CASCADE;