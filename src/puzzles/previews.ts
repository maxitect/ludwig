import type { ReactNode } from "react";
import type { PayloadOf, PuzzleTypeKey } from "./registry";
import { Preview as acrosticPreview } from "./acrostic/preview";
import { Preview as anagramPreview } from "./anagram/preview";
import { Preview as bookCipherPreview } from "./book-cipher/preview";
import { Preview as caesarPreview } from "./caesar/preview";
import { Preview as cctvMazePreview } from "./cctv-maze/preview";
import { Preview as crosswordPreview } from "./crossword/preview";
import { Preview as futoshikiPreview } from "./futoshiki/preview";
import { Preview as gearTrainPreview } from "./gear-train/preview";
import { Preview as gearsPreview } from "./gears/preview";
import { Preview as keywordPreview } from "./keyword/preview";
import { Preview as knightsKnavesPreview } from "./knights-knaves/preview";
import { Preview as logicGridPreview } from "./logic-grid/preview";
import { Preview as napkinMathsPreview } from "./napkin-maths/preview";
import { Preview as oddOneOutPreview } from "./odd-one-out/preview";
import { Preview as pictogramCipherPreview } from "./pictogram-cipher/preview";
import { Preview as reverseChessPreview } from "./reverse-chess/preview";
import { Preview as rotaPreview } from "./rota/preview";
import { Preview as sightlinesPreview } from "./sightlines/preview";
import { Preview as spotDifferencePreview } from "./spot-difference/preview";
import { Preview as sudokuPreview } from "./sudoku/preview";
import { Preview as wordLadderPreview } from "./word-ladder/preview";
import { Preview as wordSearchPreview } from "./word-search/preview";

type PreviewComponent<K extends PuzzleTypeKey> = (props: {
  payload: PayloadOf<K>;
}) => ReactNode;

/** Server previews by type key. Typed so a registered type without a preview fails typecheck. */
export const previews = {
  acrostic: acrosticPreview,
  anagram: anagramPreview,
  "book-cipher": bookCipherPreview,
  caesar: caesarPreview,
  "cctv-maze": cctvMazePreview,
  crossword: crosswordPreview,
  futoshiki: futoshikiPreview,
  "gear-train": gearTrainPreview,
  gears: gearsPreview,
  keyword: keywordPreview,
  "knights-knaves": knightsKnavesPreview,
  "logic-grid": logicGridPreview,
  "napkin-maths": napkinMathsPreview,
  "odd-one-out": oddOneOutPreview,
  "pictogram-cipher": pictogramCipherPreview,
  "reverse-chess": reverseChessPreview,
  rota: rotaPreview,
  sightlines: sightlinesPreview,
  "spot-difference": spotDifferencePreview,
  sudoku: sudokuPreview,
  "word-ladder": wordLadderPreview,
  "word-search": wordSearchPreview,
} satisfies { [K in PuzzleTypeKey]: PreviewComponent<K> };
