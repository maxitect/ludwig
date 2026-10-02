CREATE OR REPLACE FUNCTION public.trg_gear_puzzles_require_driver()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gear_puzzle_gears g
    WHERE g.puzzle_id = NEW.puzzle_id AND g.is_driver
  ) THEN
    RAISE EXCEPTION 'gear puzzle % has no driver gear', NEW.puzzle_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_gear_puzzles_require_driver
  AFTER INSERT ON public.gear_puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_puzzles_require_driver();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_gear_puzzle_gears_keep_driver()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.gear_puzzles p WHERE p.puzzle_id = OLD.puzzle_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.gear_puzzle_gears g
      WHERE g.puzzle_id = OLD.puzzle_id AND g.is_driver
    ) THEN
    RAISE EXCEPTION 'gear puzzle % has no driver gear', OLD.puzzle_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_gear_puzzle_gears_keep_driver
  AFTER UPDATE OF is_driver OR DELETE ON public.gear_puzzle_gears
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_puzzle_gears_keep_driver();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_gear_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_gear_attempts_fill_puzzle_id
  BEFORE INSERT ON public.gear_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_gear_attempt_swaps_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.gear_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_gear_attempt_swaps_fill_puzzle_id
  BEFORE INSERT ON public.gear_attempt_swaps
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_attempt_swaps_fill_puzzle_id();
