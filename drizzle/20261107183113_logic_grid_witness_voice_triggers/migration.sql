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
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_logic_grid_items_speaker_stays_person()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.logic_grid_items i
    WHERE i.id = NEW.id AND i.category_position <> 0
  ) THEN
    RETURN NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.logic_grid_clues c
    WHERE c.puzzle_id = NEW.puzzle_id AND c.speaker_item_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'logic grid item % speaks a clue but is no longer in the first category', NEW.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_logic_grid_items_speaker_stays_person
  AFTER UPDATE OF category_position ON public.logic_grid_items
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_logic_grid_items_speaker_stays_person();
