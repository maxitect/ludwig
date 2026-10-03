CREATE TYPE "retro_castle_side" AS ENUM('kingside', 'queenside');--> statement-breakpoint
CREATE TYPE "retro_goal_kind" AS ENUM('piece_on_square', 'castling_right', 'piece_count');--> statement-breakpoint
CREATE TABLE "reverse_chess_goal_castling_right" (
	"puzzle_id" uuid PRIMARY KEY,
	"kind" "retro_goal_kind" GENERATED ALWAYS AS ('castling_right'::retro_goal_kind) STORED NOT NULL,
	"colour" "chess_colour" NOT NULL,
	"side" "retro_castle_side" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_goal_piece_count" (
	"puzzle_id" uuid PRIMARY KEY,
	"kind" "retro_goal_kind" GENERATED ALWAYS AS ('piece_count'::retro_goal_kind) STORED NOT NULL,
	"colour" "chess_colour" NOT NULL,
	"piece" "chess_piece" NOT NULL,
	"count" smallint NOT NULL,
	CONSTRAINT "reverse_chess_goal_piece_count_count_check" CHECK ("count" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_goal_piece_on_square" (
	"puzzle_id" uuid PRIMARY KEY,
	"kind" "retro_goal_kind" GENERATED ALWAYS AS ('piece_on_square'::retro_goal_kind) STORED NOT NULL,
	"colour" "chess_colour" NOT NULL,
	"piece" "chess_piece" NOT NULL,
	"file" "chess_file" NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "reverse_chess_goal_piece_on_square_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_goals" (
	"puzzle_id" uuid PRIMARY KEY,
	"kind" "retro_goal_kind" NOT NULL,
	"display_text" text NOT NULL,
	CONSTRAINT "reverse_chess_goals_puzzle_id_kind_unique" UNIQUE("puzzle_id","kind")
);
--> statement-breakpoint
ALTER TABLE "reverse_chess_puzzles" DROP COLUMN "goal_text";--> statement-breakpoint
ALTER TABLE "reverse_chess_goal_castling_right" ADD CONSTRAINT "reverse_chess_goal_castling_right_puzzle_id_kind_fk" FOREIGN KEY ("puzzle_id","kind") REFERENCES "reverse_chess_goals"("puzzle_id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_goal_piece_count" ADD CONSTRAINT "reverse_chess_goal_piece_count_puzzle_id_kind_fk" FOREIGN KEY ("puzzle_id","kind") REFERENCES "reverse_chess_goals"("puzzle_id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_goal_piece_on_square" ADD CONSTRAINT "reverse_chess_goal_piece_on_square_puzzle_id_kind_fk" FOREIGN KEY ("puzzle_id","kind") REFERENCES "reverse_chess_goals"("puzzle_id","kind") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_goals" ADD CONSTRAINT "reverse_chess_goals_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reverse_chess_puzzles"("puzzle_id") ON DELETE CASCADE;