CREATE OR REPLACE FUNCTION public.trg_gear_train_requires_fixed_cogs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := CASE WHEN TG_TABLE_NAME = 'gear_train_puzzles' THEN NEW.puzzle_id ELSE OLD.puzzle_id END;
  IF TG_TABLE_NAME = 'gear_train_fixed_cogs'
    AND NOT EXISTS (SELECT 1 FROM public.gear_train_puzzles p WHERE p.puzzle_id = pid) THEN
    RETURN NULL;
  END IF;
  IF (
    SELECT count(DISTINCT f.role) FROM public.gear_train_fixed_cogs f WHERE f.puzzle_id = pid
  ) <> 2 THEN
    RAISE EXCEPTION 'gear train puzzle % needs both a driver and a target cog', pid
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_gear_train_puzzles_require_fixed_cogs
  AFTER INSERT ON public.gear_train_puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_train_requires_fixed_cogs();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_gear_train_fixed_cogs_keep_both
  AFTER UPDATE OF role OR DELETE ON public.gear_train_fixed_cogs
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_train_requires_fixed_cogs();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_gear_train_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_gear_train_attempts_fill_puzzle_id
  BEFORE INSERT ON public.gear_train_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_train_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_gear_train_attempt_cogs_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.gear_train_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_gear_train_attempt_cogs_fill_puzzle_id
  BEFORE INSERT ON public.gear_train_attempt_cogs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gear_train_attempt_cogs_fill_puzzle_id();
