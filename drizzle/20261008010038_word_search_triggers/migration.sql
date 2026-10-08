CREATE OR REPLACE FUNCTION public.trg_word_search_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_word_search_attempts_fill_puzzle_id
  BEFORE INSERT ON public.word_search_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_word_search_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_word_search_attempt_found_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.word_search_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_word_search_attempt_found_fill_puzzle_id
  BEFORE INSERT ON public.word_search_attempt_found
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_word_search_attempt_found_fill_puzzle_id();
