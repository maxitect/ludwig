CREATE TYPE "wall_side" AS ENUM('north', 'west');--> statement-breakpoint
CREATE TABLE "cctv_maze_attempt_steps" (
	"attempt_id" uuid,
	"step" smallint,
	"row" smallint NOT NULL,
	"col" smallint NOT NULL,
	CONSTRAINT "cctv_maze_attempt_steps_pkey" PRIMARY KEY("attempt_id","step"),
	CONSTRAINT "cctv_maze_attempt_steps_step_check" CHECK ("step" >= 0),
	CONSTRAINT "cctv_maze_attempt_steps_row_check" CHECK ("row" >= 0),
	CONSTRAINT "cctv_maze_attempt_steps_col_check" CHECK ("col" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cctv_maze_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('cctv-maze') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cctv_maze_cameras" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"facing" "compass8" NOT NULL,
	"fov_deg" smallint NOT NULL,
	"range_cells" smallint NOT NULL,
	CONSTRAINT "cctv_maze_cameras_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "cctv_maze_cameras_row_check" CHECK ("row" >= 0),
	CONSTRAINT "cctv_maze_cameras_col_check" CHECK ("col" >= 0),
	CONSTRAINT "cctv_maze_cameras_fov_deg_check" CHECK ("fov_deg" between 1 and 360),
	CONSTRAINT "cctv_maze_cameras_range_cells_check" CHECK ("range_cells" >= 1)
);
--> statement-breakpoint
CREATE TABLE "cctv_maze_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('cctv-maze') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	"start_row" smallint NOT NULL,
	"start_col" smallint NOT NULL,
	"exit_row" smallint NOT NULL,
	"exit_col" smallint NOT NULL,
	CONSTRAINT "cctv_maze_puzzles_rows_check" CHECK ("rows" between 3 and 15),
	CONSTRAINT "cctv_maze_puzzles_cols_check" CHECK ("cols" between 3 and 15),
	CONSTRAINT "cctv_maze_puzzles_start_row_check" CHECK ("start_row" between 0 and "rows" - 1),
	CONSTRAINT "cctv_maze_puzzles_start_col_check" CHECK ("start_col" between 0 and "cols" - 1),
	CONSTRAINT "cctv_maze_puzzles_exit_row_check" CHECK ("exit_row" between 0 and "rows" - 1),
	CONSTRAINT "cctv_maze_puzzles_exit_col_check" CHECK ("exit_col" between 0 and "cols" - 1)
);
--> statement-breakpoint
CREATE TABLE "cctv_maze_walls" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"side" "wall_side",
	CONSTRAINT "cctv_maze_walls_pkey" PRIMARY KEY("puzzle_id","row","col","side"),
	CONSTRAINT "cctv_maze_walls_row_check" CHECK ("row" >= 0),
	CONSTRAINT "cctv_maze_walls_col_check" CHECK ("col" >= 0)
);
--> statement-breakpoint
ALTER TABLE "cctv_maze_attempt_steps" ADD CONSTRAINT "cctv_maze_attempt_steps_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "cctv_maze_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cctv_maze_attempts" ADD CONSTRAINT "cctv_maze_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cctv_maze_cameras" ADD CONSTRAINT "cctv_maze_cameras_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "cctv_maze_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cctv_maze_puzzles" ADD CONSTRAINT "cctv_maze_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cctv_maze_walls" ADD CONSTRAINT "cctv_maze_walls_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "cctv_maze_puzzles"("puzzle_id") ON DELETE CASCADE;