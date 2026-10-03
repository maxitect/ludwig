CREATE OR REPLACE FUNCTION public.trg_spot_difference_attempt_found_within_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  difference_count smallint;
BEGIN
  SELECT p.difference_count INTO difference_count
  FROM public.attempts a
  JOIN public.spot_difference_puzzles p ON p.puzzle_id = a.puzzle_id
  WHERE a.id = NEW.attempt_id;

  IF difference_count IS NULL OR NEW.difference_index >= difference_count THEN
    RAISE EXCEPTION 'difference % is beyond the puzzle''s count of %', NEW.difference_index, difference_count
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_spot_difference_attempt_found_within_count
  AFTER INSERT OR UPDATE ON public.spot_difference_attempt_found
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_spot_difference_attempt_found_within_count();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_spot_difference_puzzles_keep_found_within_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.attempts a
    JOIN public.spot_difference_attempt_found f ON f.attempt_id = a.id
    WHERE a.puzzle_id = NEW.puzzle_id AND f.difference_index >= NEW.difference_count
  ) THEN
    RAISE EXCEPTION 'spot the difference puzzle % has found differences beyond the new count of %', NEW.puzzle_id, NEW.difference_count
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_spot_difference_puzzles_keep_found_within_count
  AFTER UPDATE OF difference_count ON public.spot_difference_puzzles
  FOR EACH ROW
  WHEN (NEW.difference_count < OLD.difference_count)
  EXECUTE FUNCTION public.trg_spot_difference_puzzles_keep_found_within_count();
