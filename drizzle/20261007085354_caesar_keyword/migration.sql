CREATE TABLE "caesar_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('caesar') STORED NOT NULL,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "caesar_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('caesar') STORED NOT NULL,
	"plaintext" text NOT NULL,
	"shift" integer NOT NULL,
	CONSTRAINT "caesar_puzzles_shift_check" CHECK ("shift" between 1 and 25)
);
--> statement-breakpoint
CREATE TABLE "keyword_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('keyword') STORED NOT NULL,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "keyword_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('keyword') STORED NOT NULL,
	"plaintext" text NOT NULL,
	"keyword" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caesar_attempts" ADD CONSTRAINT "caesar_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "caesar_puzzles" ADD CONSTRAINT "caesar_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "keyword_attempts" ADD CONSTRAINT "keyword_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "keyword_puzzles" ADD CONSTRAINT "keyword_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;