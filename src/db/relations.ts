import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
    settings: r.one.userSettings({
      from: r.user.id,
      to: r.userSettings.userId,
    }),
    attempts: r.many.attempts({ from: r.user.id, to: r.attempts.userId }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  userSettings: {
    user: r.one.user({
      from: r.userSettings.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  puzzleCategories: {
    types: r.many.puzzleTypes({
      from: r.puzzleCategories.key,
      to: r.puzzleTypes.categoryKey,
    }),
  },
  puzzleTypes: {
    category: r.one.puzzleCategories({
      from: r.puzzleTypes.categoryKey,
      to: r.puzzleCategories.key,
      optional: false,
    }),
    puzzles: r.many.puzzles({
      from: r.puzzleTypes.key,
      to: r.puzzles.typeKey,
    }),
  },
  volumes: {
    puzzles: r.many.puzzles({ from: r.volumes.id, to: r.puzzles.volumeId }),
  },
  puzzles: {
    type: r.one.puzzleTypes({
      from: r.puzzles.typeKey,
      to: r.puzzleTypes.key,
      optional: false,
    }),
    volume: r.one.volumes({ from: r.puzzles.volumeId, to: r.volumes.id }),
    weekly: r.many.weeklyPuzzles({
      from: r.puzzles.id,
      to: r.weeklyPuzzles.puzzleId,
    }),
    attempts: r.many.attempts({ from: r.puzzles.id, to: r.attempts.puzzleId }),
  },
  reverseChessPuzzles: {
    pieces: r.many.reverseChessPieces({
      from: r.reverseChessPuzzles.puzzleId,
      to: r.reverseChessPieces.puzzleId,
    }),
    solutionPlies: r.many.reverseChessSolutionPlies({
      from: r.reverseChessPuzzles.puzzleId,
      to: r.reverseChessSolutionPlies.puzzleId,
    }),
  },
  gearPuzzles: {
    gears: r.many.gearPuzzleGears({
      from: r.gearPuzzles.puzzleId,
      to: r.gearPuzzleGears.puzzleId,
    }),
    meshes: r.many.gearMeshes({
      from: r.gearPuzzles.puzzleId,
      to: r.gearMeshes.puzzleId,
    }),
  },
  gearSolutions: {
    swaps: r.many.gearSolutionSwaps({
      from: r.gearSolutions.puzzleId,
      to: r.gearSolutionSwaps.puzzleId,
    }),
  },
  rotaPuzzles: {
    workers: r.many.rotaWorkers({
      from: r.rotaPuzzles.puzzleId,
      to: r.rotaWorkers.puzzleId,
    }),
    clues: r.many.rotaClues({
      from: r.rotaPuzzles.puzzleId,
      to: r.rotaClues.puzzleId,
    }),
  },
  rotaWorkers: {
    squares: r.many.rotaWorkerSquares({
      from: [r.rotaWorkers.puzzleId, r.rotaWorkers.id],
      to: [r.rotaWorkerSquares.puzzleId, r.rotaWorkerSquares.workerId],
    }),
  },
  rotaClues: {
    unpoweredSquare: r.one.rotaClueUnpoweredSquare({
      from: r.rotaClues.id,
      to: r.rotaClueUnpoweredSquare.clueId,
    }),
    neverInRank: r.one.rotaClueNeverInRank({
      from: r.rotaClues.id,
      to: r.rotaClueNeverInRank.clueId,
    }),
    maxSwaps: r.one.rotaClueMaxSwaps({
      from: r.rotaClues.id,
      to: r.rotaClueMaxSwaps.clueId,
    }),
  },
  rotaSolutions: {
    swaps: r.many.rotaSolutionSwaps({
      from: r.rotaSolutions.puzzleId,
      to: r.rotaSolutionSwaps.puzzleId,
    }),
  },
  weeklyPuzzles: {
    puzzle: r.one.puzzles({
      from: r.weeklyPuzzles.puzzleId,
      to: r.puzzles.id,
      optional: false,
    }),
  },
  attempts: {
    user: r.one.user({
      from: r.attempts.userId,
      to: r.user.id,
      optional: false,
    }),
    puzzle: r.one.puzzles({
      from: [r.attempts.puzzleId, r.attempts.typeKey],
      to: [r.puzzles.id, r.puzzles.typeKey],
      optional: false,
    }),
    hints: r.many.attemptHints({
      from: r.attempts.id,
      to: r.attemptHints.attemptId,
    }),
  },
  attemptHints: {
    attempt: r.one.attempts({
      from: r.attemptHints.attemptId,
      to: r.attempts.id,
      optional: false,
    }),
  },
}));
