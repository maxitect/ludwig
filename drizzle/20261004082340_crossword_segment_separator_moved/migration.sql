CREATE OR REPLACE FUNCTION public.trg_crossword_clue_segments_last_has_no_separator()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  clue record;
BEGIN
  FOR clue IN
    SELECT DISTINCT v.puzzle_id, v.direction, v.row, v.col
    FROM (VALUES
      (CASE WHEN TG_OP <> 'DELETE' THEN NEW.puzzle_id END,
       CASE WHEN TG_OP <> 'DELETE' THEN NEW.direction END,
       CASE WHEN TG_OP <> 'DELETE' THEN NEW.row END,
       CASE WHEN TG_OP <> 'DELETE' THEN NEW.col END),
      (CASE WHEN TG_OP <> 'INSERT' THEN OLD.puzzle_id END,
       CASE WHEN TG_OP <> 'INSERT' THEN OLD.direction END,
       CASE WHEN TG_OP <> 'INSERT' THEN OLD.row END,
       CASE WHEN TG_OP <> 'INSERT' THEN OLD.col END)
    ) v(puzzle_id, direction, row, col)
    WHERE v.puzzle_id IS NOT NULL
  LOOP
    IF EXISTS (
      SELECT 1
      FROM public.crossword_clue_segments s
      WHERE s.puzzle_id = clue.puzzle_id
        AND s.direction = clue.direction
        AND s.row = clue.row
        AND s.col = clue.col
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
        clue.puzzle_id, clue.direction, clue.row, clue.col
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;
