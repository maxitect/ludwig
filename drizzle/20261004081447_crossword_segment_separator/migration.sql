CREATE TYPE "segment_separator" AS ENUM('word', 'hyphen');--> statement-breakpoint
ALTER TABLE "crossword_clue_segments" ADD COLUMN "separator" "segment_separator";