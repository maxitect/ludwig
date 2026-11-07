-- A new enum value cannot be used in the transaction that adds it, and drizzle-kit migrates in one transaction,
-- so the type is rebuilt instead of extended.
DROP TRIGGER trg_rota_clues_require_subtype ON public.rota_clues;--> statement-breakpoint
ALTER TABLE "rota_clue_unpowered_square" DROP CONSTRAINT "rota_clue_unpowered_square_clue_id_kind_fk";--> statement-breakpoint
ALTER TABLE "rota_clue_unpowered_square" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" DROP CONSTRAINT "rota_clue_never_in_rank_clue_id_kind_fk";--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "rota_clue_max_swaps" DROP CONSTRAINT "rota_clue_max_swaps_clue_id_kind_fk";--> statement-breakpoint
ALTER TABLE "rota_clue_max_swaps" DROP COLUMN "kind";--> statement-breakpoint
ALTER TYPE "rota_clue_kind" RENAME TO "rota_clue_kind_old";--> statement-breakpoint
CREATE TYPE "rota_clue_kind" AS ENUM ('unpowered_square', 'adjacent_only', 'never_in_rank', 'max_swaps', 'not_instigator');--> statement-breakpoint
ALTER TABLE "rota_clues" ALTER COLUMN "kind" TYPE "rota_clue_kind" USING "kind"::text::"rota_clue_kind";--> statement-breakpoint
ALTER TABLE "rota_clue_unpowered_square" ADD COLUMN "kind" "rota_clue_kind" GENERATED ALWAYS AS ('unpowered_square'::rota_clue_kind) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "rota_clue_unpowered_square" ADD CONSTRAINT "rota_clue_unpowered_square_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" ADD COLUMN "kind" "rota_clue_kind" GENERATED ALWAYS AS ('never_in_rank'::rota_clue_kind) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "rota_clue_never_in_rank" ADD CONSTRAINT "rota_clue_never_in_rank_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_max_swaps" ADD COLUMN "kind" "rota_clue_kind" GENERATED ALWAYS AS ('max_swaps'::rota_clue_kind) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "rota_clue_max_swaps" ADD CONSTRAINT "rota_clue_max_swaps_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
DROP TYPE "rota_clue_kind_old";--> statement-breakpoint
CREATE TABLE "rota_clue_not_instigator" (
	"clue_id" uuid PRIMARY KEY,
	"kind" "rota_clue_kind" GENERATED ALWAYS AS ('not_instigator'::rota_clue_kind) STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"worker_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rota_attempts" ADD COLUMN "instigator_worker_id" uuid;--> statement-breakpoint
ALTER TABLE "rota_clues" ADD COLUMN "speaker_worker_id" uuid;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ADD COLUMN "brief" text;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ADD COLUMN "victim_worker_id" uuid;--> statement-breakpoint
ALTER TABLE "rota_solution_swaps" ADD COLUMN "excuse" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "rota_solution_swaps" ALTER COLUMN "excuse" DROP DEFAULT;--> statement-breakpoint
UPDATE "rota_puzzles" p SET "brief" = 'Awaiting the next seed.', "victim_worker_id" = (SELECT w."id" FROM "rota_workers" w WHERE w."puzzle_id" = p."puzzle_id" ORDER BY w."name" LIMIT 1);--> statement-breakpoint
ALTER TABLE "rota_puzzles" ALTER COLUMN "brief" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ALTER COLUMN "victim_worker_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rota_attempts" ADD CONSTRAINT "rota_attempts_instigator_fk" FOREIGN KEY ("puzzle_id","instigator_worker_id") REFERENCES "rota_workers"("puzzle_id","id") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "rota_clue_not_instigator" ADD CONSTRAINT "rota_clue_not_instigator_clue_id_kind_fk" FOREIGN KEY ("clue_id","kind") REFERENCES "rota_clues"("id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_not_instigator" ADD CONSTRAINT "rota_clue_not_instigator_clue_id_puzzle_id_fk" FOREIGN KEY ("clue_id","puzzle_id") REFERENCES "rota_clues"("id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clue_not_instigator" ADD CONSTRAINT "rota_clue_not_instigator_worker_fk" FOREIGN KEY ("puzzle_id","worker_id") REFERENCES "rota_workers"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rota_clues" ADD CONSTRAINT "rota_clues_speaker_fk" FOREIGN KEY ("puzzle_id","speaker_worker_id") REFERENCES "rota_workers"("puzzle_id","id") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ADD CONSTRAINT "rota_puzzles_victim_fk" FOREIGN KEY ("puzzle_id","victim_worker_id") REFERENCES "rota_workers"("puzzle_id","id") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "rota_puzzles" ADD CONSTRAINT "rota_puzzles_brief_check" CHECK (char_length("brief") between 1 and 280);