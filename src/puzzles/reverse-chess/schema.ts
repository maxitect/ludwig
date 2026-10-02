import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  reverseChessAttemptPlies,
  reverseChessPieces,
  reverseChessPuzzles,
  reverseChessSolutionPlies,
} from "./tables";

const rank = (schema: z.ZodNumber) => schema.min(1).max(8);
const plyRanks = { fromRank: rank, toRank: rank };

const puzzleSelect = createSelectSchema(reverseChessPuzzles).omit({
  puzzleId: true,
  typeKey: true,
});
const puzzleInsert = createInsertSchema(reverseChessPuzzles).omit({
  puzzleId: true,
  plyCount: true,
});
const pieceSelect = createSelectSchema(reverseChessPieces, { rank }).omit({
  puzzleId: true,
});
const pieceInsert = createInsertSchema(reverseChessPieces, { rank }).omit({
  puzzleId: true,
});
const solutionPlyInsert = createInsertSchema(
  reverseChessSolutionPlies,
  plyRanks,
).omit({ puzzleId: true, ply: true });
const attemptPlyInsert = createInsertSchema(
  reverseChessAttemptPlies,
  plyRanks,
).omit({ attemptId: true, ply: true });

export const solutionPlySchema = createSelectSchema(
  reverseChessSolutionPlies,
  plyRanks,
).omit({ puzzleId: true, ply: true });

export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  pieces: z.array(pieceSelect),
});

export const answerSchema = z.object({ plies: z.array(attemptPlyInsert) });

export const contentSchema = z.object({
  ...puzzleInsert.shape,
  pieces: z.array(pieceInsert).min(2),
  solutionPlies: z.array(solutionPlyInsert).min(1),
});

export const attemptSchema = z.object({ plies: z.array(attemptPlyInsert) });

export type Payload = z.infer<typeof payloadSchema>;
export type Content = z.infer<typeof contentSchema>;
export type SolutionPly = z.infer<typeof solutionPlySchema>;
