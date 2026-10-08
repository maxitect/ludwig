CREATE OR REPLACE FUNCTION public.trg_knights_knaves_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_knights_knaves_attempts_fill_puzzle_id
  BEFORE INSERT ON public.knights_knaves_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_knights_knaves_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_knights_knaves_attempt_roles_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.knights_knaves_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_knights_knaves_attempt_roles_fill_puzzle_id
  BEFORE INSERT ON public.knights_knaves_attempt_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_knights_knaves_attempt_roles_fill_puzzle_id();
