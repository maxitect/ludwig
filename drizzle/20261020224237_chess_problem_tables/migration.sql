CREATE TABLE "chess_problem_attempt_plies" (
	"attempt_id" uuid,
	"ply" smallint,
	"from_file" "chess_file" NOT NULL,
	"from_rank" smallint NOT NULL,
	"to_file" "chess_file" NOT NULL,
	"to_rank" smallint NOT NULL,
	"promotion" "chess_piece",
	CONSTRAINT "chess_problem_attempt_plies_pkey" PRIMARY KEY("attempt_id","ply"),
	CONSTRAINT "chess_problem_attempt_plies_ply_check" CHECK ("ply" between 1 and 3),
	CONSTRAINT "chess_problem_attempt_plies_from_rank_check" CHECK ("from_rank" between 1 and 8),
	CONSTRAINT "chess_problem_attempt_plies_to_rank_check" CHECK ("to_rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "chess_problem_attempts" (
	"attempt_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('chess-problem') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chess_problem_pieces" (
	"puzzle_id" uuid,
	"file" "chess_file",
	"rank" smallint,
	"colour" "chess_colour" NOT NULL,
	"piece" "chess_piece" NOT NULL,
	CONSTRAINT "chess_problem_pieces_pkey" PRIMARY KEY("puzzle_id","file","rank"),
	CONSTRAINT "chess_problem_pieces_rank_check" CHECK ("rank" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "chess_problem_puzzles" (
	"puzzle_id" uuid PRIMARY KEY,
	"type_key" text GENERATED ALWAYS AS ('chess-problem') STORED NOT NULL,
	"mate_in" smallint NOT NULL,
	"white_kingside" boolean NOT NULL,
	"white_queenside" boolean NOT NULL,
	"black_kingside" boolean NOT NULL,
	"black_queenside" boolean NOT NULL,
	"en_passant_file" "chess_file",
	CONSTRAINT "chess_problem_puzzles_mate_in_check" CHECK ("mate_in" between 1 and 2)
);
--> statement-breakpoint
ALTER TABLE "chess_problem_attempt_plies" ADD CONSTRAINT "chess_problem_attempt_plies_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "chess_problem_attempts"("attempt_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chess_problem_attempts" ADD CONSTRAINT "chess_problem_attempts_attempt_id_type_key_fk" FOREIGN KEY ("attempt_id","type_key") REFERENCES "attempts"("id","type_key") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chess_problem_pieces" ADD CONSTRAINT "chess_problem_pieces_puzzle_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "chess_problem_puzzles"("puzzle_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chess_problem_puzzles" ADD CONSTRAINT "chess_problem_puzzles_puzzle_id_type_key_fk" FOREIGN KEY ("puzzle_id","type_key") REFERENCES "puzzles"("id","type_key") ON DELETE CASCADE;