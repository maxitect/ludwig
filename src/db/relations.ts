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
    crossword: r.one.crosswordPuzzles({
      from: r.puzzles.id,
      to: r.crosswordPuzzles.puzzleId,
    }),
    attempts: r.many.attempts({ from: r.puzzles.id, to: r.attempts.puzzleId }),
    reverseChess: r.one.reverseChessPuzzles({
      from: r.puzzles.id,
      to: r.reverseChessPuzzles.puzzleId,
    }),
    gears: r.one.gearPuzzles({
      from: r.puzzles.id,
      to: r.gearPuzzles.puzzleId,
    }),
  },
  gearDaily: {
    puzzle: r.one.puzzles({
      from: r.gearDaily.puzzleId,
      to: r.puzzles.id,
      optional: false,
    }),
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
    goal: r.one.reverseChessGoals({
      from: r.reverseChessPuzzles.puzzleId,
      to: r.reverseChessGoals.puzzleId,
    }),
  },
  reverseChessGoals: {
    pieceOnSquare: r.one.reverseChessGoalPieceOnSquare({
      from: r.reverseChessGoals.puzzleId,
      to: r.reverseChessGoalPieceOnSquare.puzzleId,
    }),
    castlingRight: r.one.reverseChessGoalCastlingRight({
      from: r.reverseChessGoals.puzzleId,
      to: r.reverseChessGoalCastlingRight.puzzleId,
    }),
    pieceCount: r.one.reverseChessGoalPieceCount({
      from: r.reverseChessGoals.puzzleId,
      to: r.reverseChessGoalPieceCount.puzzleId,
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
  reverseChessAttempts: {
    plies: r.many.reverseChessAttemptPlies({
      from: r.reverseChessAttempts.attemptId,
      to: r.reverseChessAttemptPlies.attemptId,
    }),
  },
  gearAttempts: {
    swaps: r.many.gearAttemptSwaps({
      from: r.gearAttempts.attemptId,
      to: r.gearAttemptSwaps.attemptId,
    }),
  },
  rotaAttempts: {
    swaps: r.many.rotaAttemptSwaps({
      from: r.rotaAttempts.attemptId,
      to: r.rotaAttemptSwaps.attemptId,
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
  crosswordPuzzles: {
    cells: r.many.crosswordCells({
      from: r.crosswordPuzzles.puzzleId,
      to: r.crosswordCells.puzzleId,
    }),
    clues: r.many.crosswordClues({
      from: r.crosswordPuzzles.puzzleId,
      to: r.crosswordClues.puzzleId,
    }),
  },
  crosswordClues: {
    segments: r.many.crosswordClueSegments({
      from: [
        r.crosswordClues.puzzleId,
        r.crosswordClues.direction,
        r.crosswordClues.row,
        r.crosswordClues.col,
      ],
      to: [
        r.crosswordClueSegments.puzzleId,
        r.crosswordClueSegments.direction,
        r.crosswordClueSegments.row,
        r.crosswordClueSegments.col,
      ],
    }),
  },
  crosswordAttempts: {
    cells: r.many.crosswordAttemptCells({
      from: r.crosswordAttempts.attemptId,
      to: r.crosswordAttemptCells.attemptId,
    }),
  },
  sudokuPuzzles: {
    givens: r.many.sudokuGivens({
      from: r.sudokuPuzzles.puzzleId,
      to: r.sudokuGivens.puzzleId,
    }),
  },
  sudokuAttempts: {
    cells: r.many.sudokuAttemptCells({
      from: r.sudokuAttempts.attemptId,
      to: r.sudokuAttemptCells.attemptId,
    }),
    notes: r.many.sudokuAttemptNotes({
      from: r.sudokuAttempts.attemptId,
      to: r.sudokuAttemptNotes.attemptId,
    }),
  },
  pictogramCipherPuzzles: {
    symbols: r.many.pictogramCipherSymbols({
      from: r.pictogramCipherPuzzles.puzzleId,
      to: r.pictogramCipherSymbols.puzzleId,
    }),
    givenGlyphs: r.many.pictogramCipherGivenGlyphs({
      from: r.pictogramCipherPuzzles.puzzleId,
      to: r.pictogramCipherGivenGlyphs.puzzleId,
    }),
  },
  pictogramCipherSymbols: {
    glyph: r.one.pictogramGlyphs({
      from: r.pictogramCipherSymbols.glyphId,
      to: r.pictogramGlyphs.id,
      optional: false,
    }),
  },
  pictogramCipherGivenGlyphs: {
    glyph: r.one.pictogramGlyphs({
      from: r.pictogramCipherGivenGlyphs.glyphId,
      to: r.pictogramGlyphs.id,
      optional: false,
    }),
  },
  pictogramCipherAttempts: {
    guesses: r.many.pictogramCipherAttemptGuesses({
      from: r.pictogramCipherAttempts.attemptId,
      to: r.pictogramCipherAttemptGuesses.attemptId,
    }),
  },
  pictogramCipherAttemptGuesses: {
    glyph: r.one.pictogramGlyphs({
      from: r.pictogramCipherAttemptGuesses.glyphId,
      to: r.pictogramGlyphs.id,
      optional: false,
    }),
  },
  bookTexts: {
    lines: r.many.bookTextLines({
      from: r.bookTexts.id,
      to: r.bookTextLines.textId,
    }),
  },
  bookCipherPuzzles: {
    text: r.one.bookTexts({
      from: r.bookCipherPuzzles.textId,
      to: r.bookTexts.id,
      optional: false,
    }),
    refs: r.many.bookCipherRefs({
      from: r.bookCipherPuzzles.puzzleId,
      to: r.bookCipherRefs.puzzleId,
    }),
  },
  futoshikiPuzzles: {
    givens: r.many.futoshikiGivens({
      from: r.futoshikiPuzzles.puzzleId,
      to: r.futoshikiGivens.puzzleId,
    }),
    inequalities: r.many.futoshikiInequalities({
      from: r.futoshikiPuzzles.puzzleId,
      to: r.futoshikiInequalities.puzzleId,
    }),
  },
  futoshikiAttempts: {
    cells: r.many.futoshikiAttemptCells({
      from: r.futoshikiAttempts.attemptId,
      to: r.futoshikiAttemptCells.attemptId,
    }),
    notes: r.many.futoshikiAttemptNotes({
      from: r.futoshikiAttempts.attemptId,
      to: r.futoshikiAttemptNotes.attemptId,
    }),
  },
  spotDifferenceAttempts: {
    found: r.many.spotDifferenceAttemptFound({
      from: r.spotDifferenceAttempts.attemptId,
      to: r.spotDifferenceAttemptFound.attemptId,
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
