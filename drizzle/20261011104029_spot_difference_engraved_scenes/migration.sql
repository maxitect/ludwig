-- The seeded SVG puzzles have no engraved scene to map to. Deleting them cascades to their
-- subtype rows, weekly slots and every attempt, including saved finds (pre-launch data).
DELETE FROM "puzzles" WHERE "type_key" = 'spot-difference';--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_spot_difference_attempt_found_within_count ON public.spot_difference_attempt_found;--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_spot_difference_puzzles_keep_found_within_count ON public.spot_difference_puzzles;--> statement-breakpoint
DROP FUNCTION IF EXISTS public.trg_spot_difference_attempt_found_within_count();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.trg_spot_difference_puzzles_keep_found_within_count();--> statement-breakpoint
CREATE TABLE "spot_difference_differences" (
	"puzzle_id" uuid,
	"difference_index" smallint,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "spot_difference_differences_pkey" PRIMARY KEY("puzzle_id","difference_index"),
	CONSTRAINT "spot_difference_differences_difference_index_check" CHECK ("difference_index" between 0 and 14),
	CONSTRAINT "spot_difference_differences_origin_check" CHECK ("x" >= 0 and "y" >= 0),
	CONSTRAINT "spot_difference_differences_size_check" CHECK ("width" > 0 and "height" > 0)
);
--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" DROP CONSTRAINT "spot_difference_attempt_found_attempt_id_fk";--> statement-breakpoint
ALTER TABLE "spot_difference_attempts" DROP CONSTRAINT "spot_difference_attempts_attempt_id_type_key_fk";--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP CONSTRAINT "spot_difference_puzzles_scene_seed_check";--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP CONSTRAINT "spot_difference_puzzles_difference_count_check";--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP CONSTRAINT "spot_difference_puzzles_generator_version_check";--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" DROP CONSTRAINT "spot_difference_attempt_found_difference_index_check";--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" ADD COLUMN "puzzle_id" uuid DEFAULT NULL NOT NULL;--> statement-breakpoint
ALTER TABLE "spot_difference_attempts" ADD COLUMN "puzzle_id" uuid DEFAULT NULL NOT NULL;--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" ADD COLUMN "scene_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP COLUMN "scene_seed";--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP COLUMN "difference_count";--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" DROP COLUMN "generator_version";--> statement-breakpoint
ALTER TABLE "spot_difference_attempts" ADD CONSTRAINT "spot_difference_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id");--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" ADD CONSTRAINT "spot_difference_attempt_found_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "spot_difference_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "spot_difference_attempt_found" ADD CONSTRAINT "spot_difference_attempt_found_difference_fk" FOREIGN KEY ("puzzle_id","difference_index") REFERENCES "spot_difference_differences"("puzzle_id","difference_index");--> statement-breakpoint
ALTER TABLE "spot_difference_attempts" ADD CONSTRAINT "spot_difference_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "spot_difference_differences" ADD CONSTRAINT "spot_difference_differences_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "spot_difference_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "spot_difference_puzzles" ADD CONSTRAINT "spot_difference_puzzles_scene_key_check" CHECK ("scene_key" <> '');