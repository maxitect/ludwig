CREATE TABLE "odd_one_out_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('odd-one-out') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"item_position" smallint
);
--> statement-breakpoint
CREATE TABLE "odd_one_out_items" (
	"puzzle_id" uuid,
	"position" smallint,
	"label" text NOT NULL,
	CONSTRAINT "odd_one_out_items_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "odd_one_out_items_puzzle_id_label_unique" UNIQUE("puzzle_id","label") DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "odd_one_out_items_position_check" CHECK ("position" between 0 and 4),
	CONSTRAINT "odd_one_out_items_label_check" CHECK (char_length("label") between 1 and 60)
);
--> statement-breakpoint
CREATE TABLE "odd_one_out_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('odd-one-out') STORED NOT NULL,
	"prompt_text" text NOT NULL,
	CONSTRAINT "odd_one_out_puzzles_prompt_text_check" CHECK (char_length("prompt_text") between 1 and 300)
);
--> statement-breakpoint
CREATE TABLE "odd_one_out_solutions" (
	"puzzle_id" uuid PRIMARY KEY,
	"item_position" smallint NOT NULL,
	"explanation" text NOT NULL,
	CONSTRAINT "odd_one_out_solutions_explanation_check" CHECK (char_length(btrim("explanation")) between 1 and 600)
);
--> statement-breakpoint
ALTER TABLE "odd_one_out_attempts" ADD CONSTRAINT "odd_one_out_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "odd_one_out_attempts" ADD CONSTRAINT "odd_one_out_attempts_item_fk" FOREIGN KEY ("puzzle_id","item_position") REFERENCES "odd_one_out_items"("puzzle_id","position") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "odd_one_out_items" ADD CONSTRAINT "odd_one_out_items_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "odd_one_out_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "odd_one_out_puzzles" ADD CONSTRAINT "odd_one_out_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "odd_one_out_solutions" ADD CONSTRAINT "odd_one_out_solutions_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "odd_one_out_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "odd_one_out_solutions" ADD CONSTRAINT "odd_one_out_solutions_item_fk" FOREIGN KEY ("puzzle_id","item_position") REFERENCES "odd_one_out_items"("puzzle_id","position");