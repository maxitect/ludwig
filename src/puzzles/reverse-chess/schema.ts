import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  reverseChessAttemptPlies,
  reverseChessGoalCastlingRight,
  reverseChessGoalPieceCount,
  reverseChessGoalPieceOnSquare,
  reverseChessGoals,
  reverseChessPieces,
  reverseChessPuzzles,
  reverseChessSolutionPlies,
} from "./tables";

const rank = (schema: z.ZodNumber) => schema.min(1).max(8);
const plyRanks = { fromRank: rank, toRank: rank };

const goalSelect = createSelectSchema(reverseChessGoals).pick({
  displayText: true,
});
const goalInsert = createInsertSchema(reverseChessGoals).pick({
  displayText: true,
});
const pieceOnSquare = createSelectSchema(reverseChessGoalPieceOnSquare, {
  kind: z.literal("piece_on_square"),
  rank,
}).pick({ kind: true, colour: true, piece: true, file: true, rank: true });
const castlingRight = createSelectSchema(reverseChessGoalCastlingRight, {
  kind: z.literal("castling_right"),
}).pick({ kind: true, colour: true, side: true });
const pieceCount = createSelectSchema(reverseChessGoalPieceCount, {
  kind: z.literal("piece_count"),
  count: (schema) => schema.min(0).max(10),
}).pick({ kind: true, colour: true, piece: true, count: true });

const initialPosition = createSelectSchema(reverseChessGoals, {
  kind: z.literal("initial_position"),
}).pick({ kind: true });

/** The condition a Mode B chain must reach, a predicate on the final position. */
export const goalSchema = z.discriminatedUnion("kind", [
  pieceOnSquare,
  castlingRight,
  pieceCount,
  initialPosition,
]);

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

export const solutionSchema = z.object({
  plies: z.array(solutionPlySchema),
  goal: goalSchema.nullable(),
});

export const payloadSchema = z.object({
  ...puzzleSelect.shape,
  goalText: goalSelect.shape.displayText.nullable(),
  pieces: z.array(pieceSelect),
});

export const answerSchema = z.object({ plies: z.array(attemptPlyInsert) });

export const contentSchema = z
  .object({
    ...puzzleInsert.shape,
    pieces: z.array(pieceInsert).min(2),
    solutionPlies: z.array(solutionPlyInsert).min(1),
    goal: z.intersection(goalInsert, goalSchema).optional(),
  })
  .refine(({ mode, goal }) => (mode === "unwind") === (goal !== undefined), {
    message: "unwind puzzles need a goal and last_move puzzles must not have one",
    path: ["goal"],
  });

export const attemptSchema = z.object({ plies: z.array(attemptPlyInsert) });

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Content = z.infer<typeof contentSchema>;
export type SolutionPly = z.infer<typeof solutionPlySchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Goal = z.infer<typeof goalSchema>;
/** A goal that is a predicate on the final position alone, searched backwards by `goalChains`. */
export type PositionGoal = Exclude<Goal, { kind: "initial_position" }>;
