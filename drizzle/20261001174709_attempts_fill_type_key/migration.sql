CREATE OR REPLACE FUNCTION public.trg_attempts_fill_type_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.type_key := COALESCE(
    (SELECT p.type_key FROM public.puzzles p WHERE p.id = NEW.puzzle_id),
    NEW.type_key
  );

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_attempts_fill_type_key
  BEFORE INSERT OR UPDATE OF puzzle_id ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_attempts_fill_type_key();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.trg_attempts_fill_type_key() FROM PUBLIC;
