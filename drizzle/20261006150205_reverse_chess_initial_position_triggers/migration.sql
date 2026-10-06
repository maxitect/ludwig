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
    WHEN 'initial_position' THEN true
  END) THEN
    RAISE EXCEPTION 'reverse chess goal % of kind % has no subtype row', NEW.puzzle_id, NEW.kind
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.trg_reverse_chess_initial_position_ply_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  puzzle public.reverse_chess_puzzles%ROWTYPE;
  expected integer;
BEGIN
  SELECT p.* INTO puzzle
  FROM public.reverse_chess_puzzles p
  WHERE p.puzzle_id = NEW.puzzle_id;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.reverse_chess_goals g
    WHERE g.puzzle_id = NEW.puzzle_id AND g.kind = 'initial_position'
  ) THEN
    RETURN NULL;
  END IF;
  expected := 2 * (puzzle.fullmove - 1) + (CASE puzzle.side_to_move WHEN 'black' THEN 1 ELSE 0 END);
  IF puzzle.ply_count <> expected THEN
    RAISE EXCEPTION 'reverse chess puzzle % has ply_count % but its initial_position goal needs %',
      NEW.puzzle_id, puzzle.ply_count, expected
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_goals_initial_position_ply_count
  AFTER INSERT OR UPDATE OF kind ON public.reverse_chess_goals
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_initial_position_ply_count();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_reverse_chess_puzzles_initial_position_ply_count
  AFTER INSERT OR UPDATE OF ply_count, fullmove, side_to_move ON public.reverse_chess_puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reverse_chess_initial_position_ply_count();
