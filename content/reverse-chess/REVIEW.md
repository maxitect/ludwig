# Reverse Chess legality review

Every position here is the end of a proof game: a sequence of legal moves from the standard starting position, replayed move by move in chess.js while the content files were generated. The retro solution is read off the last move(s) of that game, so each puzzle is reachable by construction. `pnpm puzzles:verify` then proves the solution is the only one.

All ten puzzles are original. They were produced by randomised search over legal games, not taken from any published collection of retro problems.

Ladder (SPEC section 5.1):

| Rung | Slugs |
| --- | --- |
| 1. Last move forced because the king is in check | `pawn-check` |
| 2. Captures with uncapture | `knight-taken`, `bishop-taken`, `knight-trade` (Mode B) |
| 3. Promotion, en passant, castling | `underpromotion`, `promotion-capture`, `passing-pawn` (Mode B, en passant), `last-castled` (Mode B, castling) |
| 4. Most candidate un-moves create an impossible check | `nothing-hidden`, `seventh-heaven` |

Mode A: `pawn-check`, `knight-taken`, `bishop-taken`, `underpromotion`, `promotion-capture`, `nothing-hidden`, `seventh-heaven`. Mode B: `knight-trade`, `passing-pawn`, `last-castled` (two plies each).

## pawn-check

Position `rnbqkbnr/pppp1p2/7p/6p1/7P/4pPPN/PPPPPK2/RNBQ1B1R w kq - 0 6`.
Proof game: 1.h4 g5 2.f3 e5 3.g3 h6 4.Nh3 e4 5.Kf2 e3+.
White is in check from a pawn that has just arrived on e3; the only way to have given check is e4-e3. The king move Kf2 was legal because e1 and f2 were free, and no black piece had a check on f2 before.

## knight-taken

Position `r1bqk1nr/pppp1ppp/4p3/n7/3P4/P1bQ3N/1PP1PPPP/R1B1KB1R w KQkq - 0 6`.
Proof game: 1.a3 Nc6 2.d4 e6 3.Nc3 Na5 4.Qd3 Bb4 5.Nh3 Bxc3+.
Black's bishop took the knight on c3 with check. Black still has both knights (one on a5, one on g8), so the captured piece is White's knight and the uncapture is a white knight.

## bishop-taken

Position `rnbqkb1r/p1pp1ppp/7n/1p3P2/7P/N1PP4/PP1pP1P1/R2QKBNR w KQkq - 0 10`.
Proof game: 1.Nh3 Na6 2.Ng1 Nh6 3.c3 e5 4.f4 e4 5.d3 b6 6.Na3 e3 7.h4 Nb8 8.Bd2 b5 9.f5 exd2+.
The e-pawn walked to e3 and captured the bishop on d2 with check. The white light-square bishop is still on f1 and the dark-square bishop is the captured piece, so the uncapture is a bishop.

## underpromotion

Position `rnbq1Bnr/2ppk1pp/p3p3/1pb5/8/8/PP1P1PPP/RNBQKBNR b KQ - 0 8`.
Proof game: 1.c4 e6 2.c5 Bxc5 3.e3 b6 4.e4 a6 5.e5 f6 6.exf6 b5 7.f7+ Ke7 8.f8=B+.
White's c-pawn was captured on c5 (2...Bxc5) and the e-pawn promoted via f6-f7-f8 to a third bishop, so White has the six untouched pawns a2, b2, d2, f2, g2, h2 plus the promoted piece: eight pawns' worth in all. The new bishop stands on the dark square f8 beside White's original dark-squared bishop on c1, which is fine for a promoted piece. The promotion itself was a capture-free push to f8, so the unpromote has no uncapture.

## promotion-capture

Position `rnbRkbnr/p1pp1pp1/8/5p1p/1p6/1P1B4/P1PP2PP/RNBQK1NR b KQkq - 0 9`.
Proof game: 1.e4 b5 2.f4 e6 3.f5 exf5 4.e5 Ne7 5.e6 Ng8 6.e7 b4 7.b3 h6 8.Bd3 h5 9.exd8=R+.
The white e-pawn promoted by capturing Black's queen on d8 and became a rook. White has lost the f-pawn (captured on f5), so a ninth pawn is never needed. The black queen is the uncaptured piece, and the move is unpromote plus uncapture.

## nothing-hidden

Position `rnb2bnr/1pp5/p3kppp/1q1ppP2/2PPN1PP/1P2B2R/P3P3/RN1QKB2 b Q - 0 12`.
Proof game: 1.b3 e6 2.d4 d5 3.f4 h6 4.Nh3 Qd7 5.g4 g6 6.c4 Ke7 7.Ng5 a6 8.Ne4 e5 9.h4 Ke6 10.Rh3 Qb5 11.Be3 f6 12.f5+.
The white f-pawn gives check to the king on e6. Almost every other piece that could have moved last would have left Black in check before the move, so the check is what makes the answer unique. Rooks and king keep the queenside castling right (Ra1 and Ke1 never moved).

## seventh-heaven

Position `r1bqkbnr/4pp2/pp3np1/2p4p/4PQ2/1PN1B3/P1PpBPPP/R3KR2 w Qkq - 0 13`.
Proof game: 1.Nf3 g6 2.Ne5 d5 3.Nc4 h6 4.Nc3 Nd7 5.d3 b6 6.b3 dxc4 7.e4 Ndf6 8.Qd2 c5 9.Be2 a6 10.Rf1 h5 11.Qf4 cxd3 12.Be3 d2+.
A black pawn on d2 gives check to the king on e1. The pawn came from d3 (it captured nothing), and the white queen left d2 on move 11. White's kingside rook has moved (Rf1) but the Ra1 and king still hold queenside castling rights.

## knight-trade (Mode B, two plies)

Position `rnbqkbr1/1ppppppn/p7/8/8/2P5/PP1PPPPP/RNBQKB1R w KQq - 0 5`, goal "Black has all eight pawns".
Proof game: 1.Nh3 a6 2.c3 Nf6 3.Ng5 Rg8 4.Nxh7 Nxh7.
The last two plies are 4.Nxh7 (White's knight takes the h7 pawn) and 4...Nxh7 (Black's knight retakes). Taking both back restores the black h-pawn, so Black has eight pawns again. The verifier shows no other two-ply chain reaches eight black pawns.

## passing-pawn (Mode B, two plies, en passant)

Position `rnbq1bnr/1p2pkp1/p2P3p/2p2p2/P1B5/7N/1PPP1PPP/RNBQK2R b KQ - 0 7`, goal "a black pawn on d7".
Proof game: 1.e4 c5 2.Bb5 h6 3.Nh3 f5 4.e5 a6 5.a4 Kf7 6.Bc4+ d5 7.exd6+.
The last move is en passant (e5xd6) after Black's d7-d5. The d-pawn standing on d7 is reached only by undoing the en passant capture and then the double push. A plain capture on d6 would need a black pawn there, which the chain cannot end up with on d7.

## last-castled (Mode B, two plies, castling)

Position `rnbqk2r/ppppppbp/6p1/8/8/5NPP/PPPPPPBn/RNBQ1RK1 w kq - 3 6`, goal "White can still castle kingside".
Proof game: 1.Nf3 Nf6 2.g3 g6 3.Bg2 Bg7 4.h3 Ng4 5.O-O Nh2.
The last two plies are 5.O-O and 5...Nh2. Castling rights only come back by un-castling, so the second take-back must undo O-O; the first must be the knight leaving h2 for g4 (the only legal retro move for Black here).
