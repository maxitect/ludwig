CREATE OR REPLACE FUNCTION public.trg_crossword_clue_segments_last_has_no_separator()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  target public.crossword_clue_segments;
BEGIN
  target := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  IF EXISTS (
    SELECT 1
    FROM public.crossword_clue_segments s
    WHERE s.puzzle_id = target.puzzle_id
      AND s.direction = target.direction
      AND s.row = target.row
      AND s.col = target.col
      AND s.separator IS NOT NULL
      AND s.position = (
        SELECT max(l.position)
        FROM public.crossword_clue_segments l
        WHERE l.puzzle_id = s.puzzle_id
          AND l.direction = s.direction
          AND l.row = s.row
          AND l.col = s.col
      )
  ) THEN
    RAISE EXCEPTION 'last segment of clue (%, %, %, %) carries a separator',
      target.puzzle_id, target.direction, target.row, target.col
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_crossword_clue_segments_last_has_no_separator
  AFTER INSERT OR UPDATE OR DELETE ON public.crossword_clue_segments
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_crossword_clue_segments_last_has_no_separator();
