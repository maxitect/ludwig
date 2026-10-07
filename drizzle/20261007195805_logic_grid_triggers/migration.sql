CREATE OR REPLACE FUNCTION public.trg_logic_grid_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_logic_grid_attempts_fill_puzzle_id
  BEFORE INSERT ON public.logic_grid_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_logic_grid_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_logic_grid_attempt_marks_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.logic_grid_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_logic_grid_attempt_marks_fill_puzzle_id
  BEFORE INSERT ON public.logic_grid_attempt_marks
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_logic_grid_attempt_marks_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_logic_grid_attempt_struck_clues_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.logic_grid_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_logic_grid_attempt_struck_clues_fill_puzzle_id
  BEFORE INSERT ON public.logic_grid_attempt_struck_clues
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_logic_grid_attempt_struck_clues_fill_puzzle_id();
