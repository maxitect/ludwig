CREATE TABLE "anagram_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('anagram') STORED NOT NULL,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "anagram_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('anagram') STORED NOT NULL,
	"answer" text NOT NULL,
	"definition_hint" text,
	"scramble_seed" integer NOT NULL,
	CONSTRAINT "anagram_puzzles_scramble_seed_check" CHECK ("scramble_seed" >= 0)
);
--> statement-breakpoint
ALTER TABLE "anagram_attempts" ADD CONSTRAINT "anagram_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "anagram_puzzles" ADD CONSTRAINT "anagram_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;