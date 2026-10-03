CREATE OR REPLACE FUNCTION public.trg_reverse_chess_goals_require_subtype()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.reverse_chess_goals g WHERE g.puzzle_id = NEW.puzzle_id
  ) THEN
    RETURN NULL;
  END IF;
  IF NOT (CASE NEW.kind
    WHEN 'piece_on_square' THEN EXISTS (
      SELECT 1 FROM public.reverse_chess_goal_piece_on_square s WHERE s.puzzle_id = NEW.puzzle_id)
    WHEN 'castling_right' THEN EXISTS (
      SELECT 1 FROM public.reverse_chess_goal_castling_right s WHERE s.puzzle_id = NEW.puzzle_id)
    WHEN 'piece_count' THEN EXISTS (
      SELECT 1 FROM public.reverse_chess_goal_piece_count s WHERE s.puzzle_id = NEW.puzzle_id)
  END) THEN
    RAISE EXCEPTION 'reverse chess goal % of kind % has no subtype row', NEW.puzzle_id, NEW.kind
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_goals_require_subtype
  AFTER INSERT OR UPDATE OF kind ON public.reverse_chess_goals
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_goals_require_subtype();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_reverse_chess_goal_matches_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  target_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.puzzle_id ELSE NEW.puzzle_id END;
  puzzle_mode public.retro_mode;
BEGIN
  SELECT p.mode INTO puzzle_mode
  FROM public.reverse_chess_puzzles p
  WHERE p.puzzle_id = target_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF (puzzle_mode = 'unwind') <> EXISTS (
    SELECT 1 FROM public.reverse_chess_goals g WHERE g.puzzle_id = target_id
  ) THEN
    RAISE EXCEPTION 'reverse chess puzzle % in mode % must % a goal',
      target_id, puzzle_mode,
      CASE WHEN puzzle_mode = 'unwind' THEN 'have' ELSE 'not have' END
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_puzzles_goal_matches_mode
  AFTER INSERT OR UPDATE OF mode ON public.reverse_chess_puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_goal_matches_mode();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_goals_goal_matches_mode
  AFTER INSERT OR DELETE ON public.reverse_chess_goals
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_goal_matches_mode();
