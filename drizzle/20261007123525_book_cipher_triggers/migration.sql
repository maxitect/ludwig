CREATE OR REPLACE FUNCTION public.trg_book_cipher_refs_fill_text_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.text_id IS NULL THEN
    SELECT p.text_id INTO NEW.text_id
    FROM public.book_cipher_puzzles p
    WHERE p.puzzle_id = NEW.puzzle_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_book_cipher_refs_fill_text_id
  BEFORE INSERT ON public.book_cipher_refs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_book_cipher_refs_fill_text_id();
