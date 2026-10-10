ALTER TABLE "puzzles" ADD COLUMN "volume_position" integer;--> statement-breakpoint
UPDATE "puzzles" SET "volume_position" = "ranked"."position"
FROM (
  SELECT "id", row_number() OVER (PARTITION BY "volume_id" ORDER BY "slug") AS "position"
  FROM "puzzles" WHERE "volume_id" IS NOT NULL
) AS "ranked"
WHERE "puzzles"."id" = "ranked"."id";--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_volume_id_volume_position_unique" UNIQUE("volume_id","volume_position");--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_volume_position_check" CHECK (("volume_id" is null) = ("volume_position" is null));