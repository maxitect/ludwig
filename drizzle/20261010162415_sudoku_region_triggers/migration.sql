CREATE OR REPLACE FUNCTION public.trg_sudoku_region_sets_require_cells()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := CASE WHEN TG_TABLE_NAME = 'sudoku_region_sets' THEN NEW.puzzle_id ELSE OLD.puzzle_id END;
  IF TG_TABLE_NAME = 'sudoku_region_cells'
    AND NOT EXISTS (SELECT 1 FROM public.sudoku_region_sets s WHERE s.puzzle_id = pid) THEN
    RETURN NULL;
  END IF;
  IF (SELECT count(*) FROM public.sudoku_region_cells c WHERE c.puzzle_id = pid) <> 81
    OR EXISTS (
      SELECT 1 FROM public.sudoku_region_cells c
      WHERE c.puzzle_id = pid
      GROUP BY c.region
      HAVING count(*) <> 9
    )
    OR (
      SELECT count(DISTINCT c.region) FROM public.sudoku_region_cells c WHERE c.puzzle_id = pid
    ) <> 9 THEN
    RAISE EXCEPTION 'sudoku puzzle % needs 81 region cells with nine in each of nine regions', pid
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_sudoku_region_sets_require_cells
  AFTER INSERT ON public.sudoku_region_sets
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sudoku_region_sets_require_cells();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_sudoku_region_cells_keep_complete
  AFTER UPDATE OF region OR DELETE ON public.sudoku_region_cells
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sudoku_region_sets_require_cells();
