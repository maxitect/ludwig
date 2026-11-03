CREATE TABLE "daily_puzzles" (
	"type_key" text,
	"date" date,
	"puzzle_id" uuid NOT NULL CONSTRAINT "daily_puzzles_puzzle_id_unique" UNIQUE,
	"generator_version" smallint NOT NULL,
	CONSTRAINT "daily_puzzles_pkey" PRIMARY KEY("type_key","date"),
	CONSTRAINT "daily_puzzles_generator_version_check" CHECK ("generator_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "daily_puzzles" ADD CONSTRAINT "daily_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;