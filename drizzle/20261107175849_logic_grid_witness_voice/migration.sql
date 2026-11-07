ALTER TABLE "logic_grid_clues" ADD COLUMN "speaker_item_id" uuid;--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ADD COLUMN "brief" text;--> statement-breakpoint
UPDATE "logic_grid_puzzles" SET "brief" = 'Awaiting the next seed.';--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ALTER COLUMN "brief" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "logic_grid_clues" ADD CONSTRAINT "logic_grid_clues_speaker_fk" FOREIGN KEY ("puzzle_id","speaker_item_id") REFERENCES "logic_grid_items"("puzzle_id","id") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ADD CONSTRAINT "logic_grid_puzzles_brief_check" CHECK (char_length("brief") between 1 and 280);
