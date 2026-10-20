CREATE TYPE "troix_symbol" AS ENUM('x', 'o', 'i');--> statement-breakpoint
CREATE TABLE "troix_attempt_cells" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"symbol" "troix_symbol" NOT NULL,
	CONSTRAINT "troix_attempt_cells_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "troix_attempt_cells_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "troix_attempt_cells_col_check" CHECK ("col" between 0 and 8)
);
--> statement-breakpoint
CREATE TABLE "troix_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('troix') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "troix_givens" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"symbol" "troix_symbol" NOT NULL,
	CONSTRAINT "troix_givens_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "troix_givens_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "troix_givens_col_check" CHECK ("col" between 0 and 8)
);
--> statement-breakpoint
CREATE TABLE "troix_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('troix') STORED NOT NULL,
	"size" smallint NOT NULL,
	CONSTRAINT "troix_puzzles_size_check" CHECK ("size" in (6, 9))
);
--> statement-breakpoint
ALTER TABLE "troix_attempt_cells" ADD CONSTRAINT "troix_attempt_cells_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "troix_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "troix_attempts" ADD CONSTRAINT "troix_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "troix_givens" ADD CONSTRAINT "troix_givens_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "troix_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "troix_puzzles" ADD CONSTRAINT "troix_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;