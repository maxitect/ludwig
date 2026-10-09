CREATE TYPE "compass8" AS ENUM('n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw');--> statement-breakpoint
CREATE TABLE "sightlines_attempt_marks" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "sightlines_attempt_marks_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "sightlines_attempt_marks_row_check" CHECK ("row" >= 0),
	CONSTRAINT "sightlines_attempt_marks_col_check" CHECK ("col" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sightlines_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('sightlines') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sightlines_observers" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"facing" "compass8" NOT NULL,
	"fov_deg" smallint NOT NULL,
	CONSTRAINT "sightlines_observers_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "sightlines_observers_row_check" CHECK ("row" >= 0),
	CONSTRAINT "sightlines_observers_col_check" CHECK ("col" >= 0),
	CONSTRAINT "sightlines_observers_fov_deg_check" CHECK ("fov_deg" between 1 and 360)
);
--> statement-breakpoint
CREATE TABLE "sightlines_obstacles" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "sightlines_obstacles_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "sightlines_obstacles_row_check" CHECK ("row" >= 0),
	CONSTRAINT "sightlines_obstacles_col_check" CHECK ("col" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sightlines_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('sightlines') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	"target_row" smallint NOT NULL,
	"target_col" smallint NOT NULL,
	CONSTRAINT "sightlines_puzzles_rows_check" CHECK ("rows" between 3 and 15),
	CONSTRAINT "sightlines_puzzles_cols_check" CHECK ("cols" between 3 and 15),
	CONSTRAINT "sightlines_puzzles_target_row_check" CHECK ("target_row" between 0 and "rows" - 1),
	CONSTRAINT "sightlines_puzzles_target_col_check" CHECK ("target_col" between 0 and "cols" - 1)
);
--> statement-breakpoint
ALTER TABLE "sightlines_attempt_marks" ADD CONSTRAINT "sightlines_attempt_marks_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "sightlines_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sightlines_attempts" ADD CONSTRAINT "sightlines_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sightlines_observers" ADD CONSTRAINT "sightlines_observers_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sightlines_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sightlines_obstacles" ADD CONSTRAINT "sightlines_obstacles_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "sightlines_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sightlines_puzzles" ADD CONSTRAINT "sightlines_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;