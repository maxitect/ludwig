CREATE OR REPLACE FUNCTION public.trg_rota_instigator_in_first_swap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  pid uuid;
BEGIN
  FOR pid IN
    SELECT DISTINCT v.puzzle_id
    FROM (VALUES
      (CASE WHEN TG_OP <> 'DELETE' THEN NEW.puzzle_id END),
      (CASE WHEN TG_OP <> 'INSERT' THEN OLD.puzzle_id END)
    ) v(puzzle_id)
    WHERE v.puzzle_id IS NOT NULL
  LOOP
    IF EXISTS (SELECT 1 FROM public.rota_solutions s WHERE s.puzzle_id = pid)
      AND NOT EXISTS (
        SELECT 1
        FROM public.rota_solutions s
        JOIN public.rota_solution_swaps w
          ON w.puzzle_id = s.puzzle_id AND w.step = 1
        WHERE s.puzzle_id = pid
          AND s.instigator_worker_id IN (w.worker_a_id, w.worker_b_id)
      ) THEN
      RAISE EXCEPTION 'rota puzzle % instigator is not in the first swap', pid
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_rota_solutions_instigator_in_first_swap
  AFTER INSERT OR UPDATE ON public.rota_solutions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_instigator_in_first_swap();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_rota_solution_swaps_instigator_in_first_swap
  AFTER INSERT OR UPDATE OR DELETE ON public.rota_solution_swaps
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rota_instigator_in_first_swap();
