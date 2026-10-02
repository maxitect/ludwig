CREATE TYPE "chess_colour" AS ENUM('white', 'black');--> statement-breakpoint
CREATE TYPE "chess_file" AS ENUM('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');--> statement-breakpoint
CREATE TYPE "chess_piece" AS ENUM('pawn', 'knight', 'bishop', 'rook', 'queen', 'king');--> statement-breakpoint
CREATE TYPE "retro_mode" AS ENUM('last_move', 'unwind');--> statement-breakpoint
CREATE TYPE "retro_special" AS ENUM('none', 'en_passant', 'castle');--> statement-breakpoint
CREATE TABLE "reverse_chess_attempt_plies" (
	"attempt_id" uuid,
	"ply" smallint,
	"from_file" "chess_file" NOT NULL,
	"from_rank" smallint NOT NULL,
	"to_file" "chess_file" NOT NULL,
	"to_rank" smallint NOT NULL,
	"uncapture" "chess_piece",
	"unpromote" boolean NOT NULL,
	"special" "retro_special" NOT NULL,
	CONSTRAINT "reverse_chess_attempt_plies_pkey" PRIMARY KEY("attempt_id","ply"),
	CONSTRAINT "reverse_chess_attempt_plies_ply_check" CHECK ("ply" >= 1),
	CONSTRAINT "reverse_chess_attempt_plies_from_rank_check" CHECK ("from_rank" between 1 and 8),
	CONSTRAINT "reverse_chess_attempt_plies_to_rank_check" CHECK ("to_rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('reverse-chess') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_pieces" (
	"puzzle_id" uuid,
	"file" "chess_file",
	"rank" smallint,
	"colour" "chess_colour" NOT NULL,
	"piece" "chess_piece" NOT NULL,
	CONSTRAINT "reverse_chess_pieces_pkey" PRIMARY KEY("puzzle_id","file","rank"),
	CONSTRAINT "reverse_chess_pieces_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('reverse-chess') STORED NOT NULL,
	"mode" "retro_mode" NOT NULL,
	"side_to_move" "chess_colour" NOT NULL,
	"white_kingside" boolean NOT NULL,
	"white_queenside" boolean NOT NULL,
	"black_kingside" boolean NOT NULL,
	"black_queenside" boolean NOT NULL,
	"en_passant_file" "chess_file",
	"halfmove" smallint NOT NULL,
	"fullmove" smallint NOT NULL,
	"goal_text" text,
	"ply_count" smallint NOT NULL,
	CONSTRAINT "reverse_chess_puzzles_halfmove_check" CHECK ("halfmove" >= 0),
	CONSTRAINT "reverse_chess_puzzles_fullmove_check" CHECK ("fullmove" >= 1),
	CONSTRAINT "reverse_chess_puzzles_ply_count_check" CHECK ("ply_count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "reverse_chess_solution_plies" (
	"puzzle_id" uuid,
	"ply" smallint,
	"from_file" "chess_file" NOT NULL,
	"from_rank" smallint NOT NULL,
	"to_file" "chess_file" NOT NULL,
	"to_rank" smallint NOT NULL,
	"uncapture" "chess_piece",
	"unpromote" boolean NOT NULL,
	"special" "retro_special" NOT NULL,
	CONSTRAINT "reverse_chess_solution_plies_pkey" PRIMARY KEY("puzzle_id","ply"),
	CONSTRAINT "reverse_chess_solution_plies_ply_check" CHECK ("ply" >= 1),
	CONSTRAINT "reverse_chess_solution_plies_from_rank_check" CHECK ("from_rank" between 1 and 8),
	CONSTRAINT "reverse_chess_solution_plies_to_rank_check" CHECK ("to_rank" between 1 and 8)
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_id_type_key_unique" UNIQUE("id","type_key");--> statement-breakpoint
ALTER TABLE "reverse_chess_attempt_plies" ADD CONSTRAINT "reverse_chess_attempt_plies_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "reverse_chess_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_attempts" ADD CONSTRAINT "reverse_chess_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_pieces" ADD CONSTRAINT "reverse_chess_pieces_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reverse_chess_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_puzzles" ADD CONSTRAINT "reverse_chess_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reverse_chess_solution_plies" ADD CONSTRAINT "reverse_chess_solution_plies_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "reverse_chess_puzzles"("puzzle_id") ON DELETE CASCADE;