CREATE TYPE "norinori_mark" AS ENUM('shade', 'dot');--> statement-breakpoint
CREATE TABLE "norinori_attempt_marks" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"mark" "norinori_mark" NOT NULL,
	CONSTRAINT "norinori_attempt_marks_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "norinori_attempt_marks_row_check" CHECK ("row" between 0 and 11),
	CONSTRAINT "norinori_attempt_marks_col_check" CHECK ("col" between 0 and 11)
);
--> statement-breakpoint
CREATE TABLE "norinori_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('norinori') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "norinori_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('norinori') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "norinori_puzzles_rows_check" CHECK ("rows" between 5 and 12),
	CONSTRAINT "norinori_puzzles_cols_check" CHECK ("cols" between 5 and 12)
);
--> statement-breakpoint
CREATE TABLE "norinori_region_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"region" smallint NOT NULL,
	CONSTRAINT "norinori_region_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "norinori_region_cells_row_check" CHECK ("row" between 0 and 11),
	CONSTRAINT "norinori_region_cells_col_check" CHECK ("col" between 0 and 11),
	CONSTRAINT "norinori_region_cells_region_check" CHECK ("region" >= 0)
);
--> statement-breakpoint
ALTER TABLE "norinori_attempt_marks" ADD CONSTRAINT "norinori_attempt_marks_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "norinori_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "norinori_attempts" ADD CONSTRAINT "norinori_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "norinori_puzzles" ADD CONSTRAINT "norinori_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "norinori_region_cells" ADD CONSTRAINT "norinori_region_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "norinori_puzzles"("puzzle_id") ON DELETE CASCADE;