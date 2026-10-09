CREATE OR REPLACE FUNCTION public.trg_odd_one_out_attempts_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.attempts a
    WHERE a.id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_odd_one_out_attempts_fill_puzzle_id
  BEFORE INSERT ON public.odd_one_out_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_odd_one_out_attempts_fill_puzzle_id();
