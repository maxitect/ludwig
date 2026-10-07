CREATE TYPE "grid_mark" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TABLE "logic_grid_attempt_marks" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"item_a_id" uuid,
	"item_b_id" uuid,
	"mark" "grid_mark" NOT NULL,
	CONSTRAINT "logic_grid_attempt_marks_pkey" PRIMARY KEY("attempt_id","item_a_id","item_b_id"),
	CONSTRAINT "logic_grid_attempt_marks_distinct_check" CHECK ("item_a_id" <> "item_b_id")
);
--> statement-breakpoint
CREATE TABLE "logic_grid_attempt_struck_clues" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"clue_position" smallint,
	CONSTRAINT "logic_grid_attempt_struck_clues_pkey" PRIMARY KEY("attempt_id","clue_position")
);
--> statement-breakpoint
CREATE TABLE "logic_grid_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('logic-grid') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"false_clue_position" smallint,
	CONSTRAINT "logic_grid_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "logic_grid_categories" (
	"puzzle_id" uuid,
	"position" smallint,
	"name" text NOT NULL,
	CONSTRAINT "logic_grid_categories_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "logic_grid_categories_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "logic_grid_clues" (
	"puzzle_id" uuid,
	"position" smallint,
	"content" text NOT NULL,
	"is_false" boolean DEFAULT false NOT NULL,
	CONSTRAINT "logic_grid_clues_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "logic_grid_clues_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "logic_grid_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"puzzle_id" uuid NOT NULL,
	"category_position" smallint NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "logic_grid_items_puzzle_id_id_unique" UNIQUE("puzzle_id","id"),
	CONSTRAINT "logic_grid_items_slot_unique" UNIQUE("puzzle_id","category_position","position"),
	CONSTRAINT "logic_grid_items_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "logic_grid_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('logic-grid') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logic_grid_solution_links" (
	"puzzle_id" uuid,
	"item_a_id" uuid,
	"item_b_id" uuid,
	CONSTRAINT "logic_grid_solution_links_pkey" PRIMARY KEY("puzzle_id","item_a_id","item_b_id"),
	CONSTRAINT "logic_grid_solution_links_distinct_check" CHECK ("item_a_id" <> "item_b_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "logic_grid_clues_one_false_idx" ON "logic_grid_clues" ("puzzle_id") WHERE "is_false";--> statement-breakpoint
ALTER TABLE "logic_grid_attempt_marks" ADD CONSTRAINT "logic_grid_attempt_marks_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "logic_grid_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_attempt_marks" ADD CONSTRAINT "logic_grid_attempt_marks_item_a_fk" FOREIGN KEY ("puzzle_id","item_a_id") REFERENCES "logic_grid_items"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "logic_grid_attempt_marks" ADD CONSTRAINT "logic_grid_attempt_marks_item_b_fk" FOREIGN KEY ("puzzle_id","item_b_id") REFERENCES "logic_grid_items"("puzzle_id","id");--> statement-breakpoint
ALTER TABLE "logic_grid_attempt_struck_clues" ADD CONSTRAINT "logic_grid_attempt_struck_clues_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "logic_grid_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_attempt_struck_clues" ADD CONSTRAINT "logic_grid_attempt_struck_clues_clue_fk" FOREIGN KEY ("puzzle_id","clue_position") REFERENCES "logic_grid_clues"("puzzle_id","position");--> statement-breakpoint
ALTER TABLE "logic_grid_attempts" ADD CONSTRAINT "logic_grid_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_attempts" ADD CONSTRAINT "logic_grid_attempts_false_clue_fk" FOREIGN KEY ("puzzle_id","false_clue_position") REFERENCES "logic_grid_clues"("puzzle_id","position");--> statement-breakpoint
ALTER TABLE "logic_grid_categories" ADD CONSTRAINT "logic_grid_categories_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "logic_grid_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_clues" ADD CONSTRAINT "logic_grid_clues_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "logic_grid_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_items" ADD CONSTRAINT "logic_grid_items_category_fk" FOREIGN KEY ("puzzle_id","category_position") REFERENCES "logic_grid_categories"("puzzle_id","position") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_puzzles" ADD CONSTRAINT "logic_grid_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_solution_links" ADD CONSTRAINT "logic_grid_solution_links_item_a_fk" FOREIGN KEY ("puzzle_id","item_a_id") REFERENCES "logic_grid_items"("puzzle_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "logic_grid_solution_links" ADD CONSTRAINT "logic_grid_solution_links_item_b_fk" FOREIGN KEY ("puzzle_id","item_b_id") REFERENCES "logic_grid_items"("puzzle_id","id") ON DELETE CASCADE;