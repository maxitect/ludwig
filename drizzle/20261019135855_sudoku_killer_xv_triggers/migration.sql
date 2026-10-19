CREATE OR REPLACE FUNCTION public.trg_sudoku_cages_require_cells()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  pid uuid;
  cage_id smallint;
BEGIN
  IF TG_TABLE_NAME = 'sudoku_cages' THEN
    pid := NEW.puzzle_id;
    cage_id := NEW.cage;
  ELSE
    pid := OLD.puzzle_id;
    cage_id := OLD.cage;
    IF NOT EXISTS (
      SELECT 1 FROM public.sudoku_cages g WHERE g.puzzle_id = pid AND g.cage = cage_id
    ) THEN
      RETURN NULL;
    END IF;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sudoku_cage_cells c WHERE c.puzzle_id = pid AND c.cage = cage_id
  ) THEN
    RAISE EXCEPTION 'sudoku puzzle % cage % needs at least one cell', pid, cage_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_sudoku_cages_require_cells
  AFTER INSERT ON public.sudoku_cages
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sudoku_cages_require_cells();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_sudoku_cage_cells_keep_cage_filled
  AFTER UPDATE OF cage OR DELETE ON public.sudoku_cage_cells
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sudoku_cages_require_cells();
