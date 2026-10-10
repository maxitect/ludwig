CREATE OR REPLACE FUNCTION public.trg_reverse_chess_solution_ply_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  target uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.puzzle_id ELSE NEW.puzzle_id END;
  puzzle public.reverse_chess_puzzles%ROWTYPE;
  plies integer;
BEGIN
  SELECT p.* INTO puzzle
  FROM public.reverse_chess_puzzles p
  WHERE p.puzzle_id = target;
  IF NOT FOUND OR EXISTS (
    SELECT 1 FROM public.reverse_chess_goals g
    WHERE g.puzzle_id = target AND g.kind = 'initial_position'
  ) THEN
    RETURN NULL;
  END IF;
  SELECT count(*) INTO plies
  FROM public.reverse_chess_solution_plies s
  WHERE s.puzzle_id = target;
  IF puzzle.ply_count <> plies THEN
    RAISE EXCEPTION 'reverse chess puzzle % has ply_count % but % solution plies',
      target, puzzle.ply_count, plies
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF puzzle.mode = 'last_move' AND plies <> 1 THEN
    RAISE EXCEPTION 'reverse chess puzzle % is Mode A and needs exactly one solution ply, has %',
      target, plies
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_puzzles_solution_ply_count
  AFTER INSERT OR UPDATE OF ply_count, mode ON public.reverse_chess_puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_solution_ply_count();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_goals_solution_ply_count
  AFTER INSERT OR UPDATE OF kind OR DELETE ON public.reverse_chess_goals
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_solution_ply_count();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_solution_plies_solution_ply_count
  AFTER INSERT OR UPDATE OF puzzle_id OR DELETE ON public.reverse_chess_solution_plies
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_solution_ply_count();
