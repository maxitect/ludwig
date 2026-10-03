CREATE TABLE "spot_difference_attempt_found" (
	"attempt_id" uuid,
	"difference_index" smallint,
	CONSTRAINT "spot_difference_attempt_found_pkey" PRIMARY KEY("attempt_id","difference_index"),
	CONSTRAINT "spot_difference_attempt_found_difference_index_check" CHECK ("difference_index" between 0 and 14)
);
--> statement-breakpoint
CREATE TABLE "spot_difference_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('spot-difference') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spot_difference_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('spot-difference') STORED NOT NULL,
	"scene_seed" integer NOT NULL,
	"difference_count" smallint NOT NULL,
	"generator_version" smallint NOT NULL,
	CONSTRAINT "spot_difference_puzzles_scene_seed_check" CHECK ("scene_seed" >= 0),
	CONSTRAINT "spot_difference_puzzles_difference_count_check" CHECK ("difference_count" between 1 and 15),
	CONSTRAINT "spot_difference_puzzles_generator_version_check" CHECK ("generator_version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" ADD CONSTRAINT "spot_difference_attempt_found_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "spot_difference_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "spot_difference_attempts" ADD CONSTRAINT "spot_difference_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" ADD CONSTRAINT "spot_difference_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;