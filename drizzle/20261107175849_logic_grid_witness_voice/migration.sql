ALTER TABLE "logic_grid_clues" ADD COLUMN "speaker_item_id" uuid;--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ADD COLUMN "brief" text;--> statement-breakpoint
UPDATE "logic_grid_puzzles" SET "brief" = 'Awaiting the next seed.';--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ALTER COLUMN "brief" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "logic_grid_clues" ADD CONSTRAINT "logic_grid_clues_speaker_fk" FOREIGN KEY ("puzzle_id","speaker_item_id") REFERENCES "logic_grid_items"("puzzle_id","id") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ADD CONSTRAINT "logic_grid_puzzles_brief_check" CHECK (char_length("brief") between 1 and 280);--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_logic_grid_clues_speaker_is_person()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.speaker_item_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.logic_grid_items i
    WHERE i.id = NEW.speaker_item_id
      AND i.puzzle_id = NEW.puzzle_id
      AND i.category_position = 0
  ) THEN
    RAISE EXCEPTION 'logic grid clue %/% is spoken by an item outside the first category',
      NEW.puzzle_id, NEW."position"
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_logic_grid_clues_speaker_is_person
  AFTER INSERT OR UPDATE OF speaker_item_id ON public.logic_grid_clues
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_logic_grid_clues_speaker_is_person();
