ALTER TABLE "sightlines_puzzles" ADD COLUMN "brief" text;--> statement-breakpoint
UPDATE "sightlines_puzzles" SET "brief" = 'Awaiting the next seed.';--> statement-breakpoint
ALTER TABLE "sightlines_puzzles" ALTER COLUMN "brief" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cctv_maze_puzzles" ADD COLUMN "brief" text;--> statement-breakpoint
UPDATE "cctv_maze_puzzles" SET "brief" = 'Awaiting the next seed.';--> statement-breakpoint
ALTER TABLE "cctv_maze_puzzles" ALTER COLUMN "brief" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sightlines_observers" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "sightlines_observers" AS o SET "name" = 'Observer ' || n.rn FROM (SELECT "puzzle_id", "row", "col", row_number() OVER (PARTITION BY "puzzle_id" ORDER BY "row", "col") AS rn FROM "sightlines_observers") AS n WHERE o."puzzle_id" = n."puzzle_id" AND o."row" = n."row" AND o."col" = n."col";--> statement-breakpoint
ALTER TABLE "sightlines_observers" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sightlines_observers" ADD CONSTRAINT "sightlines_observers_name_key" UNIQUE("puzzle_id","name");--> statement-breakpoint
ALTER TABLE "sightlines_observers" ADD CONSTRAINT "sightlines_observers_name_check" CHECK (char_length("name") between 1 and 40 and btrim("name") <> '' and "name" !~ '[[:cntrl:]]');--> statement-breakpoint
ALTER TABLE "sightlines_puzzles" ADD CONSTRAINT "sightlines_puzzles_brief_check" CHECK (char_length("brief") between 1 and 160 and btrim("brief") <> '' and "brief" !~ '[[:cntrl:]]');--> statement-breakpoint
ALTER TABLE "cctv_maze_puzzles" ADD CONSTRAINT "cctv_maze_puzzles_brief_check" CHECK (char_length("brief") between 1 and 160 and btrim("brief") <> '' and "brief" !~ '[[:cntrl:]]');
