CREATE TABLE "book_cipher_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('book-cipher') STORED NOT NULL,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "book_cipher_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('book-cipher') STORED NOT NULL,
	"text_id" uuid NOT NULL,
	CONSTRAINT "book_cipher_puzzles_puzzle_id_text_id_key" UNIQUE("puzzle_id","text_id")
);
--> statement-breakpoint
CREATE TABLE "book_cipher_refs" (
	"puzzle_id" uuid,
	"position" smallint,
	"text_id" uuid DEFAULT NULL NOT NULL,
	"page" smallint NOT NULL,
	"line" smallint NOT NULL,
	"word_index" smallint NOT NULL,
	CONSTRAINT "book_cipher_refs_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "book_cipher_refs_position_check" CHECK ("position" >= 0),
	CONSTRAINT "book_cipher_refs_word_index_check" CHECK ("word_index" >= 1)
);
--> statement-breakpoint
CREATE TABLE "book_text_lines" (
	"text_id" uuid,
	"page" smallint,
	"line" smallint,
	"content" text NOT NULL,
	CONSTRAINT "book_text_lines_pkey" PRIMARY KEY("text_id","page","line"),
	CONSTRAINT "book_text_lines_page_check" CHECK ("page" >= 1),
	CONSTRAINT "book_text_lines_line_check" CHECK ("line" >= 1),
	CONSTRAINT "book_text_lines_content_check" CHECK (length(btrim("content")) > 0)
);
--> statement-breakpoint
CREATE TABLE "book_texts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"source" text NOT NULL,
	"public_domain_basis" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_cipher_attempts" ADD CONSTRAINT "book_cipher_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "book_cipher_puzzles" ADD CONSTRAINT "book_cipher_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "book_cipher_puzzles" ADD CONSTRAINT "book_cipher_puzzles_text_id_fk" FOREIGN KEY ("text_id") REFERENCES "book_texts"("id");--> statement-breakpoint
ALTER TABLE "book_cipher_refs" ADD CONSTRAINT "book_cipher_refs_puzzle_id_text_id_fk" FOREIGN KEY ("puzzle_id","text_id") REFERENCES "book_cipher_puzzles"("puzzle_id","text_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "book_cipher_refs" ADD CONSTRAINT "book_cipher_refs_text_id_page_line_fk" FOREIGN KEY ("text_id","page","line") REFERENCES "book_text_lines"("text_id","page","line");--> statement-breakpoint
ALTER TABLE "book_text_lines" ADD CONSTRAINT "book_text_lines_text_id_fk" FOREIGN KEY ("text_id") REFERENCES "book_texts"("id") ON DELETE CASCADE;