import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { fenSchema } from "../_shared/chess-fen";
import {
  chessProblemAttemptPlies,
  chessProblemPieces,
  chessProblemPuzzles,
} from "./tables";

const rank = (schema: z.ZodNumber) => schema.min(1).max(8);
const plyRanks = { fromRank: rank, toRank: rank };
const mateIn = (schema: z.ZodNumber) => schema.min(1).max(2);

const puzzleSelect = createSelectSchema(chessProblemPuzzles, { mateIn }).omit({
  puzzleId: true,
  typeKey: true,
});
const puzzleInsert = createInsertSchema(chessProblemPuzzles, { mateIn }).omit({
  puzzleId: true,
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
  enPassantFile: true,
});
const pieceSelect = createSelectSchema(chessProblemPieces, { rank }).omit({
  puzzleId: true,
});
const attemptPlyInsert = createInsertSchema(
  chessProblemAttemptPlies,
  plyRanks,
).omit({ attemptId: true, ply: true });

/** No key move and no line: `check` solves the position. */
export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  pieces: z.array(pieceSelect),
});

const MAX_PLIES = 3;

export const answerSchema = z.object({
  plies: z.array(attemptPlyInsert).min(1).max(MAX_PLIES),
});

/** The ply (1-based) a failed check names as wrong. */
export const wrongPartSchema = z.object({ ply: z.number().int().min(1).max(MAX_PLIES) });

/** A content file gives the position as `fen`, with White to move, parsed into the piece rows and castling and en passant columns. */
export const contentSchema = z
  .object({ ...puzzleInsert.shape, fen: fenSchema })
  .refine(({ fen }) => fen.sideToMove === "white", {
    message: "White must be to move",
    path: ["fen"],
  })
  .transform(({ fen, ...rest }) => ({
    ...rest,
    whiteKingside: fen.whiteKingside,
    whiteQueenside: fen.whiteQueenside,
    blackKingside: fen.blackKingside,
    blackQueenside: fen.blackQueenside,
    enPassantFile: fen.enPassantFile,
    pieces: fen.pieces,
  }));

export const attemptSchema = z.object({
  plies: z.array(attemptPlyInsert).max(MAX_PLIES),
});

/** What `loadSolution` derives by solving the position: the first moves that force mate. */
export const solutionSchema = z.object({
  keys: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      promotion: z.string().optional(),
    }),
  ),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Content = z.infer<typeof contentSchema>;
export type ContentFile = z.input<typeof contentSchema>;
export type AttemptPly = z.infer<typeof attemptPlyInsert>;
export type Solution = z.infer<typeof solutionSchema>;
export type WrongPart = z.infer<typeof wrongPartSchema>;
