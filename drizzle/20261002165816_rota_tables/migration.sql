CREATE TYPE "rota_clue_kind" AS ENUM('unpowered_square', 'adjacent_only', 'never_in_rank', 'max_swaps');--> statement-breakpoint
CREATE TYPE "rota_phase" AS ENUM('intended', 'final');--> statement-breakpoint
CREATE TABLE "rota_attempt_swaps" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"step" smallint,
	"worker_a_id" uuid NOT NULL,
	"worker_b_id" uuid NOT NULL,
	CONSTRAINT "rota_attempt_swaps_pkey" PRIMARY KEY("attempt_id","step"),
	CONSTRAINT "rota_attempt_swaps_step_check" CHECK ("step" >= 1),
	CONSTRAINT "rota_attempt_swaps_distinct_check" CHECK ("worker_a_id" <> "worker_b_id")
);
--> statement-breakpoint
CREATE TABLE "rota_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('rota') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"instigator_worker_id" uuid,
	CONSTRAINT "rota_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "rota_clue_max_swaps" (
	"clue_id" uuid PRIMARY KEY,
	"kind" "rota_clue_kind" GENERATED ALWAYS AS ('max_swaps'::rota_clue_kind) STORED NOT NULL,
	"max_swaps" smallint NOT NULL,
	CONSTRAINT "rota_clue_max_swaps_max_swaps_check" CHECK ("max_swaps" >= 1)
);
--> statement-breakpoint
CREATE TABLE "rota_clue_never_in_rank" (
	"clue_id" uuid PRIMARY KEY,
	"kind" "rota_clue_kind" GENERATED ALWAYS AS ('never_in_rank'::rota_clue_kind) STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"worker_id" uuid NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "rota_clue_never_in_rank_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "rota_clue_unpowered_square" (
	"clue_id" uuid PRIMARY KEY,
	"kind" "rota_clue_kind" GENERATED ALWAYS AS ('unpowered_square'::rota_clue_kind) STORED NOT NULL,
	"file" "chess_file" NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "rota_clue_unpowered_square_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "rota_clues" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"puzzle_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"kind" "rota_clue_kind" NOT NULL,
	"display_text" text NOT NULL,
	CONSTRAINT "rota_clues_id_kind_unique" UNIQUE("id","kind"),
	CONSTRAINT "rota_clues_id_puzzle_id_unique" UNIQUE("id","puzzle_id"),
	CONSTRAINT "rota_clues_puzzle_id_position_unique" UNIQUE("puzzle_id","position"),
	CONSTRAINT "rota_clues_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rota_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('rota') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rota_solution_swaps" (
	"puzzle_id" uuid,
	"step" smallint,
	"worker_a_id" uuid NOT NULL,
	"worker_b_id" uuid NOT NULL,
	CONSTRAINT "rota_solution_swaps_pkey" PRIMARY KEY("puzzle_id","step"),
	CONSTRAINT "rota_solution_swaps_step_check" CHECK ("step" >= 1),
	CONSTRAINT "rota_solution_swaps_distinct_check" CHECK ("worker_a_id" <> "worker_b_id")
);
--> statement-breakpoint
CREATE TABLE "rota_solutions" (
	"puzzle_id" uuid PRIMARY KEY,
	"instigator_worker_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rota_worker_squares" (
	"puzzle_id" uuid,
	"worker_id" uuid,
	"phase" "rota_phase",
	"file" "chess_file" NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "rota_worker_squares_pkey" PRIMARY KEY("puzzle_id","worker_id","phase"),
	CONSTRAINT "rota_worker_squares_puzzle_id_phase_square_unique" UNIQUE("puzzle_id","phase","file","rank"),
	CONSTRAINT "rota_worker_squares_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "rota_workers" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"puzzle_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "rota_workers_puzzle_id_id_unique" UNIQUE("puzzle_id","id"),
	CONSTRAINT "rota_workers_puzzle_id_name_unique" UNIQUE("puzzle_id","name")
);
--> statement-breakpoint
ALTER TABLE "rota_attempt_swaps" ADD CONSTRAINT "rota_attempt_swaps_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "rota_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_attempt_swaps" ADD CONSTRAINT "rota_attempt_swaps_worker_a_fk" FOREIGN KEY ("puzzle_id","worker_a_id") REFERENCES "rota_workers"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "rota_attempt_swaps" ADD CONSTRAINT "rota_attempt_swaps_worker_b_fk" FOREIGN KEY ("puzzle_id","worker_b_id") REFERENCES "rota_workers"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "rota_attempts" ADD CONSTRAINT "rota_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_attempts" ADD CONSTRAINT "rota_attempts_instigator_fk" FOREIGN KEY ("puzzle_id","instigator_worker_id") REFERENCES "rota_workers"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "rota_clue_max_swaps" ADD CONSTRAINT "rota_clue_max_swaps_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" ADD CONSTRAINT "rota_clue_never_in_rank_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" ADD CONSTRAINT "rota_clue_never_in_rank_clue_id_puzzle_id_fk" FOREIGN KEY ("clue_id","puzzle_id") REFERENCES "rota_clues"("id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" ADD CONSTRAINT "rota_clue_never_in_rank_worker_fk" FOREIGN KEY ("puzzle_id","worker_id") REFERENCES "rota_workers"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_unpowered_square" ADD CONSTRAINT "rota_clue_unpowered_square_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clues" ADD CONSTRAINT "rota_clues_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "rota_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ADD CONSTRAINT "rota_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_solution_swaps" ADD CONSTRAINT "rota_solution_swaps_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "rota_solutions"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_solution_swaps" ADD CONSTRAINT "rota_solution_swaps_worker_a_fk" FOREIGN KEY ("puzzle_id","worker_a_id") REFERENCES "rota_workers"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_solution_swaps" ADD CONSTRAINT "rota_solution_swaps_worker_b_fk" FOREIGN KEY ("puzzle_id","worker_b_id") REFERENCES "rota_workers"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_solutions" ADD CONSTRAINT "rota_solutions_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "rota_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_solutions" ADD CONSTRAINT "rota_solutions_instigator_fk" FOREIGN KEY ("puzzle_id","instigator_worker_id") REFERENCES "rota_workers"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "rota_worker_squares" ADD CONSTRAINT "rota_worker_squares_worker_fk" FOREIGN KEY ("puzzle_id","worker_id") REFERENCES "rota_workers"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_workers" ADD CONSTRAINT "rota_workers_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "rota_puzzles"("puzzle_id") ON DELETE CASCADE;