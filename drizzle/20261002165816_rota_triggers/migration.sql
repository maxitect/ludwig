CREATE OR REPLACE FUNCTION public.trg_rota_clues_require_subtype()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rota_clues c WHERE c.id = NEW.id) THEN
    RETURN NULL;
  END IF;
  IF NOT (CASE NEW.kind
    WHEN 'adjacent_only' THEN true
    WHEN 'unpowered_square' THEN EXISTS (
      SELECT 1 FROM public.rota_clue_unpowered_square s WHERE s.clue_id = NEW.id)
    WHEN 'never_in_rank' THEN EXISTS (
      SELECT 1 FROM public.rota_clue_never_in_rank s WHERE s.clue_id = NEW.id)
    WHEN 'max_swaps' THEN EXISTS (
      SELECT 1 FROM public.rota_clue_max_swaps s WHERE s.clue_id = NEW.id)
  END) THEN
    RAISE EXCEPTION 'rota clue % of kind % has no subtype row', NEW.id, NEW.kind
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_rota_clues_require_subtype
  AFTER INSERT OR UPDATE OF kind ON public.rota_clues
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_clues_require_subtype();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_rota_clue_never_in_rank_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT c.puzzle_id INTO NEW.puzzle_id
    FROM public.rota_clues c
    WHERE c.id = NEW.clue_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_rota_clue_never_in_rank_fill_puzzle_id
  BEFORE INSERT ON public.rota_clue_never_in_rank
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_clue_never_in_rank_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_rota_attempts_fill_puzzle_id()
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
CREATE TRIGGER trg_rota_attempts_fill_puzzle_id
  BEFORE INSERT ON public.rota_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_attempts_fill_puzzle_id();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_rota_attempt_swaps_fill_puzzle_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.puzzle_id IS NULL THEN
    SELECT a.puzzle_id INTO NEW.puzzle_id
    FROM public.rota_attempts a
    WHERE a.attempt_id = NEW.attempt_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_rota_attempt_swaps_fill_puzzle_id
  BEFORE INSERT ON public.rota_attempt_swaps
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_attempt_swaps_fill_puzzle_id();
