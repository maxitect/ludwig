CREATE TABLE "gear_attempt_swaps" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"gear_a_id" uuid,
	"gear_b_id" uuid,
	CONSTRAINT "gear_attempt_swaps_pkey" PRIMARY KEY("attempt_id","gear_a_id","gear_b_id"),
	CONSTRAINT "gear_attempt_swaps_order_check" CHECK ("gear_a_id" < "gear_b_id")
);
--> statement-breakpoint
CREATE TABLE "gear_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('gears') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"crank" smallint NOT NULL,
	"convergence" smallint,
	"accused_gear_id" uuid,
	CONSTRAINT "gear_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id"),
	CONSTRAINT "gear_attempts_crank_check" CHECK ("crank" >= 0),
	CONSTRAINT "gear_attempts_convergence_check" CHECK ("convergence" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "gear_daily" (
	"date" date PRIMARY KEY,
	"puzzle_id" uuid NOT NULL CONSTRAINT "gear_daily_puzzle_id_unique" UNIQUE
);
--> statement-breakpoint
CREATE TABLE "gear_meshes" (
	"puzzle_id" uuid,
	"gear_a_id" uuid,
	"gear_b_id" uuid,
	CONSTRAINT "gear_meshes_pkey" PRIMARY KEY("puzzle_id","gear_a_id","gear_b_id"),
	CONSTRAINT "gear_meshes_order_check" CHECK ("gear_a_id" < "gear_b_id")
);
--> statement-breakpoint
CREATE TABLE "gear_puzzle_gears" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"puzzle_id" uuid NOT NULL,
	"label" text NOT NULL,
	"teeth" smallint NOT NULL,
	"start_slot" smallint NOT NULL,
	"initial_offset" smallint NOT NULL,
	"half_width_deg" smallint NOT NULL,
	"is_driver" boolean NOT NULL,
	CONSTRAINT "gear_puzzle_gears_puzzle_id_id_unique" UNIQUE("puzzle_id","id"),
	CONSTRAINT "gear_puzzle_gears_puzzle_id_label_unique" UNIQUE("puzzle_id","label"),
	CONSTRAINT "gear_puzzle_gears_teeth_check" CHECK ("teeth" in (8, 12, 16, 24)),
	CONSTRAINT "gear_puzzle_gears_start_slot_check" CHECK ("start_slot" >= 0),
	CONSTRAINT "gear_puzzle_gears_initial_offset_check" CHECK ("initial_offset" >= 0 and "initial_offset" < "teeth"),
	CONSTRAINT "gear_puzzle_gears_half_width_deg_check" CHECK ("half_width_deg" between 1 and 180)
);
--> statement-breakpoint
CREATE TABLE "gear_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('gears') STORED NOT NULL,
	"slot_count" smallint NOT NULL,
	"m_in" smallint NOT NULL,
	"m_out" smallint NOT NULL,
	"max_adjustments" smallint NOT NULL,
	"occlusion" boolean NOT NULL,
	"generator_seed" text,
	CONSTRAINT "gear_puzzles_slot_count_check" CHECK ("slot_count" >= 2 and "slot_count" % 2 = 0),
	CONSTRAINT "gear_puzzles_m_in_m_out_check" CHECK ("m_in" <> "m_out"),
	CONSTRAINT "gear_puzzles_max_adjustments_check" CHECK ("max_adjustments" >= 0)
);
--> statement-breakpoint
CREATE TABLE "gear_solution_swaps" (
	"puzzle_id" uuid,
	"gear_a_id" uuid,
	"gear_b_id" uuid,
	CONSTRAINT "gear_solution_swaps_pkey" PRIMARY KEY("puzzle_id","gear_a_id","gear_b_id"),
	CONSTRAINT "gear_solution_swaps_order_check" CHECK ("gear_a_id" < "gear_b_id")
);
--> statement-breakpoint
CREATE TABLE "gear_solutions" (
	"puzzle_id" uuid PRIMARY KEY,
	"crank" smallint NOT NULL,
	"convergence" smallint NOT NULL,
	"killer_gear_id" uuid NOT NULL,
	CONSTRAINT "gear_solutions_crank_check" CHECK ("crank" >= 0),
	CONSTRAINT "gear_solutions_convergence_check" CHECK ("convergence" between 1 and 8)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gear_puzzle_gears_one_driver_idx" ON "gear_puzzle_gears" ("puzzle_id") WHERE "is_driver";--> statement-breakpoint
ALTER TABLE "gear_attempt_swaps" ADD CONSTRAINT "gear_attempt_swaps_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "gear_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_attempt_swaps" ADD CONSTRAINT "gear_attempt_swaps_gear_a_fk" FOREIGN KEY ("puzzle_id","gear_a_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "gear_attempt_swaps" ADD CONSTRAINT "gear_attempt_swaps_gear_b_fk" FOREIGN KEY ("puzzle_id","gear_b_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "gear_attempts" ADD CONSTRAINT "gear_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_attempts" ADD CONSTRAINT "gear_attempts_accused_gear_fk" FOREIGN KEY ("puzzle_id","accused_gear_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "gear_daily" ADD CONSTRAINT "gear_daily_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_meshes" ADD CONSTRAINT "gear_meshes_gear_a_fk" FOREIGN KEY ("puzzle_id","gear_a_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_meshes" ADD CONSTRAINT "gear_meshes_gear_b_fk" FOREIGN KEY ("puzzle_id","gear_b_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_puzzle_gears" ADD CONSTRAINT "gear_puzzle_gears_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_puzzles" ADD CONSTRAINT "gear_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_solution_swaps" ADD CONSTRAINT "gear_solution_swaps_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_solutions"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_solution_swaps" ADD CONSTRAINT "gear_solution_swaps_gear_a_fk" FOREIGN KEY ("puzzle_id","gear_a_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_solution_swaps" ADD CONSTRAINT "gear_solution_swaps_gear_b_fk" FOREIGN KEY ("puzzle_id","gear_b_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_solutions" ADD CONSTRAINT "gear_solutions_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "gear_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gear_solutions" ADD CONSTRAINT "gear_solutions_killer_gear_fk" FOREIGN KEY ("puzzle_id","killer_gear_id") REFERENCES "gear_puzzle_gears"("puzzle_id","id");