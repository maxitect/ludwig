CREATE OR REPLACE FUNCTION public.trg_puzzles_require_subtype()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  subtype_table text;
  has_subtype boolean;
BEGIN
  SELECT pt.subtype_table INTO subtype_table
  FROM public.puzzle_types pt
  WHERE pt.key = NEW.type_key;

  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE puzzle_id = $1)', subtype_table)
  INTO has_subtype
  USING NEW.id;

  IF NOT has_subtype THEN
    RAISE EXCEPTION 'puzzle % has no row in %', NEW.id, subtype_table
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_puzzles_require_subtype
  AFTER INSERT ON public.puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_puzzles_require_subtype();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.trg_puzzles_require_subtype() FROM PUBLIC;
