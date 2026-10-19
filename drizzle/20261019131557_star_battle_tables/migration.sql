CREATE TYPE "star_mark" AS ENUM('star', 'dot');--> statement-breakpoint
CREATE TABLE "star_battle_attempt_marks" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"mark" "star_mark" NOT NULL,
	CONSTRAINT "star_battle_attempt_marks_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "star_battle_attempt_marks_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "star_battle_attempt_marks_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "star_battle_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('star-battle') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "star_battle_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('star-battle') STORED NOT NULL,
	"size" smallint NOT NULL,
	"stars" smallint NOT NULL,
	CONSTRAINT "star_battle_puzzles_size_check" CHECK ("size" between 5 and 10),
	CONSTRAINT "star_battle_puzzles_stars_check" CHECK ("stars" between 1 and 2)
);
--> statement-breakpoint
CREATE TABLE "star_battle_region_cells" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"region" smallint NOT NULL,
	CONSTRAINT "star_battle_region_cells_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "star_battle_region_cells_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "star_battle_region_cells_col_check" CHECK ("col" between 0 and 9),
	CONSTRAINT "star_battle_region_cells_region_check" CHECK ("region" between 0 and 9)
);
--> statement-breakpoint
ALTER TABLE "star_battle_attempt_marks" ADD CONSTRAINT "star_battle_attempt_marks_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "star_battle_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "star_battle_attempts" ADD CONSTRAINT "star_battle_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "star_battle_puzzles" ADD CONSTRAINT "star_battle_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "star_battle_region_cells" ADD CONSTRAINT "star_battle_region_cells_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "star_battle_puzzles"("puzzle_id") ON DELETE CASCADE;