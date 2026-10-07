CREATE TYPE "gear_train_role" AS ENUM('driver', 'target');--> statement-breakpoint
CREATE TABLE "gear_train_attempt_cogs" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"row" smallint,
	"col" smallint,
	"teeth" smallint NOT NULL,
	CONSTRAINT "gear_train_attempt_cogs_pkey" PRIMARY KEY("attempt_id","row","col")
);
--> statement-breakpoint
CREATE TABLE "gear_train_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('gear-train') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	CONSTRAINT "gear_train_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "gear_train_bolts" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "gear_train_bolts_pkey" PRIMARY KEY("puzzle_id","row","col")
);
--> statement-breakpoint
CREATE TABLE "gear_train_fixed_cogs" (
	"puzzle_id" uuid,
	"role" "gear_train_role",
	"row" smallint NOT NULL,
	"col" smallint NOT NULL,
	"teeth" smallint NOT NULL,
	CONSTRAINT "gear_train_fixed_cogs_pkey" PRIMARY KEY("puzzle_id","role"),
	CONSTRAINT "gear_train_fixed_cogs_puzzle_id_row_col_unique" UNIQUE("puzzle_id","row","col"),
	CONSTRAINT "gear_train_fixed_cogs_teeth_check" CHECK ("teeth" in (8, 16, 24))
);
--> statement-breakpoint
CREATE TABLE "gear_train_inventory" (
	"puzzle_id" uuid,
	"teeth" smallint,
	"count" smallint NOT NULL,
	CONSTRAINT "gear_train_inventory_pkey" PRIMARY KEY("puzzle_id","teeth"),
	CONSTRAINT "gear_train_inventory_teeth_check" CHECK ("teeth" in (8, 16, 24)),
	CONSTRAINT "gear_train_inventory_count_check" CHECK ("count" between 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "gear_train_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('gear-train') STORED NOT NULL,
	"rows" smallint NOT NULL,
	"cols" smallint NOT NULL,
	"target_clockwise" boolean NOT NULL,
	CONSTRAINT "gear_train_puzzles_rows_check" CHECK ("rows" between 4 and 12),
	CONSTRAINT "gear_train_puzzles_cols_check" CHECK ("cols" between 4 and 12)
);
--> statement-breakpoint
CREATE TABLE "gear_train_solution_cogs" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"teeth" smallint NOT NULL,
	CONSTRAINT "gear_train_solution_cogs_pkey" PRIMARY KEY("puzzle_id","row","col")
);
--> statement-breakpoint
ALTER TABLE "gear_train_attempt_cogs" ADD CONSTRAINT "gear_train_attempt_cogs_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "gear_train_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_attempt_cogs" ADD CONSTRAINT "gear_train_attempt_cogs_inventory_fk" FOREIGN KEY ("puzzle_id","teeth") REFERENCES "gear_train_inventory"("puzzle_id","teeth");--> statement-breakpoint
ALTER TABLE "gear_train_attempts" ADD CONSTRAINT "gear_train_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_bolts" ADD CONSTRAINT "gear_train_bolts_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_train_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_fixed_cogs" ADD CONSTRAINT "gear_train_fixed_cogs_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_train_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_inventory" ADD CONSTRAINT "gear_train_inventory_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_train_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_puzzles" ADD CONSTRAINT "gear_train_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_solution_cogs" ADD CONSTRAINT "gear_train_solution_cogs_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_train_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_train_solution_cogs" ADD CONSTRAINT "gear_train_solution_cogs_inventory_fk" FOREIGN KEY ("puzzle_id","teeth") REFERENCES "gear_train_inventory"("puzzle_id","teeth");