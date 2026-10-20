CREATE TABLE "circle9_attempt_circles" (
	"attempt_id" uuid,
	"row" smallint,
	"col" smallint,
	CONSTRAINT "circle9_attempt_circles_pkey" PRIMARY KEY("attempt_id","row","col"),
	CONSTRAINT "circle9_attempt_circles_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "circle9_attempt_circles_col_check" CHECK ("col" between 0 and 8)
);
--> statement-breakpoint
CREATE TABLE "circle9_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('circle9') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle9_numbers" (
	"puzzle_id" uuid,
	"row" smallint,
	"col" smallint,
	"digit" smallint NOT NULL,
	CONSTRAINT "circle9_numbers_pkey" PRIMARY KEY("puzzle_id","row","col"),
	CONSTRAINT "circle9_numbers_row_check" CHECK ("row" between 0 and 8),
	CONSTRAINT "circle9_numbers_col_check" CHECK ("col" between 0 and 8),
	CONSTRAINT "circle9_numbers_digit_check" CHECK ("digit" between 1 and 9)
);
--> statement-breakpoint
CREATE TABLE "circle9_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('circle9') STORED NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle9_attempt_circles" ADD CONSTRAINT "circle9_attempt_circles_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "circle9_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "circle9_attempts" ADD CONSTRAINT "circle9_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "circle9_numbers" ADD CONSTRAINT "circle9_numbers_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "circle9_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "circle9_puzzles" ADD CONSTRAINT "circle9_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;