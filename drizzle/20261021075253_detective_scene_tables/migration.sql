CREATE TABLE "detective_scene_attempt_found" (
	"attempt_id" uuid,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	"position" smallint,
	CONSTRAINT "detective_scene_attempt_found_pkey" PRIMARY KEY("attempt_id","position")
);
--> statement-breakpoint
CREATE TABLE "detective_scene_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('detective-scene') STORED NOT NULL,
	"puzzle_id" uuid DEFAULT NULL NOT NULL,
	CONSTRAINT "detective_scene_attempts_attempt_id_puzzle_id_unique" UNIQUE("attempt_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "detective_scene_item_aliases" (
	"puzzle_id" uuid,
	"position" smallint,
	"alias" text,
	CONSTRAINT "detective_scene_item_aliases_pkey" PRIMARY KEY("puzzle_id","position","alias"),
	CONSTRAINT "detective_scene_item_aliases_alias_check" CHECK ("alias" <> '')
);
--> statement-breakpoint
CREATE TABLE "detective_scene_items" (
	"puzzle_id" uuid,
	"position" smallint,
	"title" text NOT NULL,
	"x" smallint NOT NULL,
	"y" smallint NOT NULL,
	"width" smallint NOT NULL,
	"height" smallint NOT NULL,
	CONSTRAINT "detective_scene_items_pkey" PRIMARY KEY("puzzle_id","position"),
	CONSTRAINT "detective_scene_items_position_check" CHECK ("position" between 0 and 49),
	CONSTRAINT "detective_scene_items_title_check" CHECK ("title" <> ''),
	CONSTRAINT "detective_scene_items_origin_check" CHECK ("x" >= 0 and "y" >= 0),
	CONSTRAINT "detective_scene_items_size_check" CHECK ("width" > 0 and "height" > 0)
);
--> statement-breakpoint
CREATE TABLE "detective_scene_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('detective-scene') STORED NOT NULL,
	"scene_key" text NOT NULL CONSTRAINT "detective_scene_puzzles_scene_key_unique" UNIQUE,
	"width" smallint NOT NULL,
	"height" smallint NOT NULL,
	CONSTRAINT "detective_scene_puzzles_scene_key_check" CHECK ("scene_key" <> ''),
	CONSTRAINT "detective_scene_puzzles_size_check" CHECK ("width" > 0 and "height" > 0)
);
--> statement-breakpoint
ALTER TABLE "detective_scene_attempt_found" ADD CONSTRAINT "detective_scene_attempt_found_attempt_id_puzzle_id_fk" FOREIGN KEY ("attempt_id","puzzle_id") REFERENCES "detective_scene_attempts"("attempt_id","puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "detective_scene_attempt_found" ADD CONSTRAINT "detective_scene_attempt_found_item_fk" FOREIGN KEY ("puzzle_id","position") REFERENCES "detective_scene_items"("puzzle_id","position") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "detective_scene_attempts" ADD CONSTRAINT "detective_scene_attempts_attempt_id_puzzle_id_type_key_fk" FOREIGN KEY ("attempt_id","puzzle_id","type_key") REFERENCES "attempts"("id","puzzle_id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "detective_scene_item_aliases" ADD CONSTRAINT "detective_scene_item_aliases_item_fk" FOREIGN KEY ("puzzle_id","position") REFERENCES "detective_scene_items"("puzzle_id","position") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "detective_scene_items" ADD CONSTRAINT "detective_scene_items_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "detective_scene_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "detective_scene_puzzles" ADD CONSTRAINT "detective_scene_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;