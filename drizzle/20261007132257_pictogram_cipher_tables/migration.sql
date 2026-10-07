CREATE TABLE "pictogram_cipher_attempt_guesses" (
	"attempt_id" uuid,
	"glyph_id" smallint,
	"letter" char(1) NOT NULL,
	CONSTRAINT "pictogram_cipher_attempt_guesses_pkey" PRIMARY KEY("attempt_id","glyph_id"),
	CONSTRAINT "pictogram_cipher_attempt_guesses_letter_check" CHECK ("letter" ~ '^[a-z]$')
);
--> statement-breakpoint
CREATE TABLE "pictogram_cipher_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('pictogram-cipher') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pictogram_cipher_given_glyphs" (
	"puzzle_id" uuid,
	"glyph_id" smallint,
	CONSTRAINT "pictogram_cipher_given_glyphs_pkey" PRIMARY KEY("puzzle_id","glyph_id")
);
--> statement-breakpoint
CREATE TABLE "pictogram_cipher_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('pictogram-cipher') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pictogram_cipher_symbols" (
	"puzzle_id" uuid,
	"word_index" smallint,
	"position" smallint,
	"glyph_id" smallint NOT NULL,
	CONSTRAINT "pictogram_cipher_symbols_pkey" PRIMARY KEY("puzzle_id","word_index","position"),
	CONSTRAINT "pictogram_cipher_symbols_word_index_check" CHECK ("word_index" >= 0),
	CONSTRAINT "pictogram_cipher_symbols_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pictogram_glyphs" (
	"id" smallint PRIMARY KEY,
	"asset_key" text NOT NULL UNIQUE,
	"letter" char(1) NOT NULL UNIQUE,
	CONSTRAINT "pictogram_glyphs_asset_key_check" CHECK ("asset_key" ~ '^glyph-[0-9]{2}$'),
	CONSTRAINT "pictogram_glyphs_letter_check" CHECK ("letter" ~ '^[a-z]$')
);
--> statement-breakpoint
ALTER TABLE "pictogram_cipher_attempt_guesses" ADD CONSTRAINT "pictogram_cipher_attempt_guesses_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "pictogram_cipher_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pictogram_cipher_attempt_guesses" ADD CONSTRAINT "pictogram_cipher_attempt_guesses_glyph_id_fk" FOREIGN KEY ("glyph_id") REFERENCES "pictogram_glyphs"("id");--> statement-breakpoint
ALTER TABLE "pictogram_cipher_attempts" ADD CONSTRAINT "pictogram_cipher_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pictogram_cipher_given_glyphs" ADD CONSTRAINT "pictogram_cipher_given_glyphs_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "pictogram_cipher_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pictogram_cipher_given_glyphs" ADD CONSTRAINT "pictogram_cipher_given_glyphs_glyph_id_fk" FOREIGN KEY ("glyph_id") REFERENCES "pictogram_glyphs"("id");--> statement-breakpoint
ALTER TABLE "pictogram_cipher_puzzles" ADD CONSTRAINT "pictogram_cipher_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pictogram_cipher_symbols" ADD CONSTRAINT "pictogram_cipher_symbols_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "pictogram_cipher_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pictogram_cipher_symbols" ADD CONSTRAINT "pictogram_cipher_symbols_glyph_id_fk" FOREIGN KEY ("glyph_id") REFERENCES "pictogram_glyphs"("id");