CREATE TYPE "mirror_kind" AS ENUM('slash', 'backslash');--> statement-breakpoint
CREATE TABLE "reflections_attempt_mirrors" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	"mirror" "mirror_kind" NOT NULL,
	CONSTRAINT "reflections_attempt_mirrors_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "reflections_attempt_mirrors_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "reflections_attempt_mirrors_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "reflections_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('reflections') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections_fixed_mirrors" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"mirror" "mirror_kind" NOT NULL,
	CONSTRAINT "reflections_fixed_mirrors_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "reflections_fixed_mirrors_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "reflections_fixed_mirrors_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "reflections_ports" (
	"puzzle_id" uuid,
	"side" "compass8",
	"offset" smallint,
	"label" char(1) NOT NULL,
	CONSTRAINT "reflections_ports_pkey" PRIMARY KEY("puzzle_id","side","offset"),
	CONSTRAINT "reflections_ports_side_check" CHECK ("side" in ('n', 'e', 's', 'w')),
	CONSTRAINT "reflections_ports_offset_check" CHECK ("offset" between 0 and 9),
	CONSTRAINT "reflections_ports_label_check" CHECK ("label" ~ '^[A-Z]$')
);
--> statement-breakpoint
CREATE TABLE "reflections_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('reflections') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	CONSTRAINT "reflections_puzzles_rows_check" CHECK ("rows" between 4 and 10),
	CONSTRAINT "reflections_puzzles_cols_check" CHECK ("cols" between 4 and 10)
);
--> statement-breakpoint
CREATE TABLE "reflections_slots" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "reflections_slots_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "reflections_slots_row_check" CHECK ("row" between 0 and 9),
	CONSTRAINT "reflections_slots_col_check" CHECK ("col" between 0 and 9)
);
--> statement-breakpoint
ALTER TABLE "reflections_attempt_mirrors" ADD CONSTRAINT "reflections_attempt_mirrors_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "reflections_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reflections_attempts" ADD CONSTRAINT "reflections_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reflections_fixed_mirrors" ADD CONSTRAINT "reflections_fixed_mirrors_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reflections_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reflections_ports" ADD CONSTRAINT "reflections_ports_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reflections_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reflections_puzzles" ADD CONSTRAINT "reflections_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reflections_slots" ADD CONSTRAINT "reflections_slots_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reflections_puzzles"("puzzle_id") ON DELETE CASCADE;