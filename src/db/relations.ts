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
  logicGridPuzzles: {
    categories: r.many.logicGridCategories({
      from: r.logicGridPuzzles.puzzleId,
      to: r.logicGridCategories.puzzleId,
    }),
    clues: r.many.logicGridClues({
      from: r.logicGridPuzzles.puzzleId,
      to: r.logicGridClues.puzzleId,
    }),
    links: r.many.logicGridSolutionLinks({
      from: r.logicGridPuzzles.puzzleId,
      to: r.logicGridSolutionLinks.puzzleId,
    }),
  },
  logicGridCategories: {
    items: r.many.logicGridItems({
      from: [r.logicGridCategories.puzzleId, r.logicGridCategories.position],
      to: [r.logicGridItems.puzzleId, r.logicGridItems.categoryPosition],
    }),
  },
  logicGridAttempts: {
    marks: r.many.logicGridAttemptMarks({
      from: r.logicGridAttempts.attemptId,
      to: r.logicGridAttemptMarks.attemptId,
    }),
    struckClues: r.many.logicGridAttemptStruckClues({
      from: r.logicGridAttempts.attemptId,
      to: r.logicGridAttemptStruckClues.attemptId,
    }),
  },
  gearTrainPuzzles: {
    fixedCogs: r.many.gearTrainFixedCogs({
      from: r.gearTrainPuzzles.puzzleId,
      to: r.gearTrainFixedCogs.puzzleId,
    }),
    bolts: r.many.gearTrainBolts({
      from: r.gearTrainPuzzles.puzzleId,
      to: r.gearTrainBolts.puzzleId,
    }),
    inventory: r.many.gearTrainInventory({
      from: r.gearTrainPuzzles.puzzleId,
      to: r.gearTrainInventory.puzzleId,
    }),
    solutionCogs: r.many.gearTrainSolutionCogs({
      from: r.gearTrainPuzzles.puzzleId,
      to: r.gearTrainSolutionCogs.puzzleId,
    }),
  },
  gearTrainAttempts: {
    cogs: r.many.gearTrainAttemptCogs({
      from: r.gearTrainAttempts.attemptId,
      to: r.gearTrainAttemptCogs.attemptId,
    }),
  },
  sudokuPuzzles: {
    givens: r.many.sudokuGivens({
      from: r.sudokuPuzzles.puzzleId,
      to: r.sudokuGivens.puzzleId,
    }),
    regionSet: r.one.sudokuRegionSets({
      from: r.sudokuPuzzles.puzzleId,
      to: r.sudokuRegionSets.puzzleId,
    }),
  },
  sudokuRegionSets: {
    cells: r.many.sudokuRegionCells({
      from: r.sudokuRegionSets.puzzleId,
      to: r.sudokuRegionCells.puzzleId,
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
  acrosticPuzzles: {
    lines: r.many.acrosticLines({
      from: r.acrosticPuzzles.puzzleId,
      to: r.acrosticLines.puzzleId,
    }),
  },
  knightsKnavesPuzzles: {
    characters: r.many.knightsKnavesCharacters({
      from: r.knightsKnavesPuzzles.puzzleId,
      to: r.knightsKnavesCharacters.puzzleId,
    }),
  },
  knightsKnavesCharacters: {
    statements: r.many.knightsKnavesStatements({
      from: [
        r.knightsKnavesCharacters.puzzleId,
        r.knightsKnavesCharacters.position,
      ],
      to: [
        r.knightsKnavesStatements.puzzleId,
        r.knightsKnavesStatements.characterPosition,
      ],
    }),
  },
  knightsKnavesAttempts: {
    roles: r.many.knightsKnavesAttemptRoles({
      from: r.knightsKnavesAttempts.attemptId,
      to: r.knightsKnavesAttemptRoles.attemptId,
    }),
  },
  napkinMathsPuzzles: {
    lines: r.many.napkinMathsLines({
      from: r.napkinMathsPuzzles.puzzleId,
      to: r.napkinMathsLines.puzzleId,
    }),
  },
  oddOneOutPuzzles: {
    items: r.many.oddOneOutItems({
      from: r.oddOneOutPuzzles.puzzleId,
      to: r.oddOneOutItems.puzzleId,
    }),
  },
  sightlinesPuzzles: {
    obstacles: r.many.sightlinesObstacles({
      from: r.sightlinesPuzzles.puzzleId,
      to: r.sightlinesObstacles.puzzleId,
    }),
    observers: r.many.sightlinesObservers({
      from: r.sightlinesPuzzles.puzzleId,
      to: r.sightlinesObservers.puzzleId,
    }),
  },
  sightlinesAttempts: {
    marks: r.many.sightlinesAttemptMarks({
      from: r.sightlinesAttempts.attemptId,
      to: r.sightlinesAttemptMarks.attemptId,
    }),
  },
  cctvMazePuzzles: {
    walls: r.many.cctvMazeWalls({
      from: r.cctvMazePuzzles.puzzleId,
      to: r.cctvMazeWalls.puzzleId,
    }),
    cameras: r.many.cctvMazeCameras({
      from: r.cctvMazePuzzles.puzzleId,
      to: r.cctvMazeCameras.puzzleId,
    }),
  },
  cctvMazeAttempts: {
    steps: r.many.cctvMazeAttemptSteps({
      from: r.cctvMazeAttempts.attemptId,
      to: r.cctvMazeAttemptSteps.attemptId,
    }),
  },
  wordSearchPuzzles: {
    cells: r.many.wordSearchCells({
      from: r.wordSearchPuzzles.puzzleId,
      to: r.wordSearchCells.puzzleId,
    }),
    words: r.many.wordSearchWords({
      from: r.wordSearchPuzzles.puzzleId,
      to: r.wordSearchWords.puzzleId,
    }),
  },
  wordSearchAttempts: {
    found: r.many.wordSearchAttemptFound({
      from: r.wordSearchAttempts.attemptId,
      to: r.wordSearchAttemptFound.attemptId,
    }),
  },
  wordLadderAttempts: {
    rungs: r.many.wordLadderAttemptRungs({
      from: r.wordLadderAttempts.attemptId,
      to: r.wordLadderAttemptRungs.attemptId,
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
