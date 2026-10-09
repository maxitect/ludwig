import { attemptSchema as acrosticAttempt } from "./acrostic/schema";
import { attemptSchema as anagramAttempt } from "./anagram/schema";
import { attemptSchema as bookCipherAttempt } from "./book-cipher/schema";
import { attemptSchema as caesarAttempt } from "./caesar/schema";
import { attemptSchema as crosswordAttempt } from "./crossword/schema";
import { attemptSchema as futoshikiAttempt } from "./futoshiki/schema";
import { attemptSchema as gearTrainAttempt } from "./gear-train/schema";
import { attemptSchema as gearsAttempt } from "./gears/schema";
import { attemptSchema as keywordAttempt } from "./keyword/schema";
import { attemptSchema as knightsKnavesAttempt } from "./knights-knaves/schema";
import { attemptSchema as logicGridAttempt } from "./logic-grid/schema";
import { attemptSchema as oddOneOutAttempt } from "./odd-one-out/schema";
import { attemptSchema as pictogramCipherAttempt } from "./pictogram-cipher/schema";
import { attemptSchema as reverseChessAttempt } from "./reverse-chess/schema";
import { attemptSchema as rotaAttempt } from "./rota/schema";
import { attemptSchema as spotDifferenceAttempt } from "./spot-difference/schema";
import { attemptSchema as sudokuAttempt } from "./sudoku/schema";
import { attemptSchema as wordLadderAttempt } from "./word-ladder/schema";
import { attemptSchema as wordSearchAttempt } from "./word-search/schema";

/** Attempt schemas for the types that have a solver, importable from client code (the registry is not). */
const attemptSchemas = {
  acrostic: acrosticAttempt,
  anagram: anagramAttempt,
  "book-cipher": bookCipherAttempt,
  caesar: caesarAttempt,
  crossword: crosswordAttempt,
  futoshiki: futoshikiAttempt,
  "gear-train": gearTrainAttempt,
  gears: gearsAttempt,
  keyword: keywordAttempt,
  "knights-knaves": knightsKnavesAttempt,
  "logic-grid": logicGridAttempt,
  "odd-one-out": oddOneOutAttempt,
  "pictogram-cipher": pictogramCipherAttempt,
  "reverse-chess": reverseChessAttempt,
  rota: rotaAttempt,
  "spot-difference": spotDifferenceAttempt,
  sudoku: sudokuAttempt,
  "word-ladder": wordLadderAttempt,
  "word-search": wordSearchAttempt,
} as const;

export function getAttemptSchema(typeKey: string) {
  return Object.hasOwn(attemptSchemas, typeKey)
    ? attemptSchemas[typeKey as keyof typeof attemptSchemas]
    : null;
}
