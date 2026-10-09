import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { generateScene } from "./spot-difference/engine";
import { previews } from "./previews";
import { getPuzzleModule, registry, type PuzzleTypeKey } from "./registry";

const NODE_BUDGET = 300;

type PreviewRenderer = (props: { payload: unknown }) => ReactNode;

const ids = Array.from(
  { length: 6 },
  (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`,
);

const grid = (rows: number, cols: number) =>
  Array.from({ length: rows * cols }, (_, i) => ({
    row: Math.floor(i / cols),
    col: i % cols,
  }));

const { original, altered } = generateScene(7, 5, 1);

const payloads: Record<PuzzleTypeKey, unknown> = {
  acrostic: {
    ruleLabel: "First letters",
    lines: [
      "Quiet rivers carry the evening home",
      "Under the bridge a heron waits",
      "Every ripple keeps its own counsel",
    ],
  },
  anagram: {
    definitionHint: "A pleasant place to sit",
    tiles: ["e", "t", "a", "c", "o", "g", "r"],
    wordLengths: [7],
  },
  "book-cipher": {
    title: "A Study in Scarlet",
    author: "A. Conan Doyle",
    lines: [
      { page: 1, line: 1, content: "In the year 1878 I took my degree" },
      { page: 1, line: 2, content: "of Doctor of Medicine of the University" },
      { page: 1, line: 3, content: "of London, and proceeded to Netley" },
    ],
    refs: [
      { position: 1, page: 1, line: 1, wordIndex: 2 },
      { position: 2, page: 1, line: 2, wordIndex: 3 },
      { position: 3, page: 1, line: 3, wordIndex: 1 },
    ],
  },
  "cctv-maze": {
    puzzleId: ids[0],
    rows: 5,
    cols: 5,
    startRow: 0,
    startCol: 0,
    exitRow: 4,
    exitCol: 4,
    walls: [
      { row: 1, col: 1, side: "north" },
      { row: 2, col: 3, side: "west" },
    ],
    cameras: [{ row: 2, col: 2, facing: "e", fovDeg: 90, rangeCells: 2 }],
  },
  caesar: { ciphertext: "wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj" },
  crossword: {
    style: "quick",
    rows: 5,
    cols: 5,
    cells: grid(5, 5).filter(
      ({ row, col }) => !(row % 2 === 1 && col % 2 === 1),
    ),
    clues: [
      {
        direction: "across",
        row: 0,
        col: 0,
        clueText: "A tall wading bird",
        segments: [{ length: 5, separator: "word" }],
      },
    ],
  },
  futoshiki: {
    size: 4,
    givens: [
      { row: 0, col: 1, digit: 3 },
      { row: 2, col: 2, digit: 1 },
    ],
    inequalities: [
      { row: 0, col: 0, direction: "right", relation: "lt" },
      { row: 1, col: 1, direction: "down", relation: "gt" },
    ],
  },
  "gear-train": {
    rows: 6,
    cols: 8,
    targetClockwise: false,
    driver: { row: 1, col: 1, teeth: 16 },
    target: { row: 4, col: 6, teeth: 8 },
    bolts: [{ row: 3, col: 3 }],
    inventory: [{ teeth: 8, count: 2 }],
  },
  gears: {
    slotCount: 12,
    mIn: 3,
    mOut: 1,
    maxAdjustments: 0,
    occlusion: false,
    gears: ids.slice(0, 3).map((id, i) => ({
      id,
      label: String.fromCharCode(65 + i),
      teeth: i === 1 ? 16 : 8,
      startSlot: i * 4,
      initialOffset: i,
      halfWidthDeg: 30,
      isDriver: i === 0,
    })),
    meshes: [
      { gearAId: ids[0], gearBId: ids[1] },
      { gearAId: ids[1], gearBId: ids[2] },
    ],
  },
  keyword: { ciphertext: "qhvgw bmzn yxt aqgvu" },
  "knights-knaves": {
    questionText: "Who is the knave?",
    characters: [
      { position: 1, name: "Ann", statements: ["Bob is a knave."] },
      { position: 2, name: "Bob", statements: ["Ann and I are alike."] },
    ],
  },
  "logic-grid": {
    variant: false,
    categories: [
      {
        position: 1,
        name: "Person",
        items: ["Ann", "Bob", "Cat"].map((label, i) => ({
          id: ids[i],
          position: i + 1,
          label,
        })),
      },
      {
        position: 2,
        name: "Pet",
        items: ["Dog", "Eel", "Fox"].map((label, i) => ({
          id: ids[i + 3],
          position: i + 1,
          label,
        })),
      },
    ],
    clues: [{ position: 1, content: "Ann owns the Dog." }],
  },
  "napkin-maths": {
    questionText: "How many are left?",
    lines: ["12 apples", "- 5 eaten", "+ 3 picked", "= ?"],
  },
  "odd-one-out": {
    promptText: "Which is the odd one out?",
    items: ["Magpie", "Robin", "Jackdaw", "Crow"].map((label, i) => ({
      position: i + 1,
      label,
    })),
  },
  "pictogram-cipher": {
    words: [["glyph-01", "glyph-02", "glyph-03"], ["glyph-02", "glyph-01"]],
    given: [{ assetKey: "glyph-01", letter: "a" }],
  },
  "reverse-chess": {
    mode: "last_move",
    sideToMove: "white",
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
    enPassantFile: null,
    halfmove: 0,
    fullmove: 12,
    plyCount: 1,
    goalText: null,
    pieces: [
      { file: "e", rank: 1, colour: "white", piece: "king" },
      { file: "d", rank: 4, colour: "white", piece: "pawn" },
      { file: "e", rank: 8, colour: "black", piece: "king" },
      { file: "a", rank: 7, colour: "black", piece: "rook" },
    ],
  },
  rota: {
    workers: [
      {
        id: ids[0],
        name: "Alma",
        squares: [
          { phase: "intended", file: "a", rank: 1 },
          { phase: "final", file: "b", rank: 2 },
        ],
      },
      {
        id: ids[1],
        name: "Bram",
        squares: [
          { phase: "intended", file: "b", rank: 2 },
          { phase: "final", file: "a", rank: 1 },
        ],
      },
    ],
    clues: [{ position: 1, displayText: "No more than two swaps.", kind: "max_swaps", maxSwaps: 2 }],
  },
  sightlines: {
    rows: 6,
    cols: 6,
    targetRow: 3,
    targetCol: 3,
    obstacles: [{ row: 2, col: 2 }],
    observers: [
      { row: 0, col: 0, facing: "se", fovDeg: 90 },
      { row: 5, col: 5, facing: "n", fovDeg: 360 },
    ],
  },
  "spot-difference": {
    puzzleId: ids[0],
    differenceCount: 5,
    scenes: [original, altered],
  },
  sudoku: {
    givens: [
      { row: 0, col: 0, digit: 5 },
      { row: 4, col: 4, digit: 3 },
      { row: 8, col: 8, digit: 9 },
    ],
  },
  "word-ladder": { startWord: "cold", endWord: "warm", rungCount: 5 },
  "word-search": {
    rows: 4,
    cols: 4,
    cells: grid(4, 4).map((position, i) => ({
      ...position,
      letter: "ABCD"[i % 4],
    })),
    words: ["ABC"],
  },
};

const countElements = (markup: string) => markup.match(/<[a-z]/g)?.length ?? 0;

describe("previews", () => {
  it("has a fixture and a preview for every registered type", () => {
    expect(Object.keys(previews).toSorted()).toEqual(
      Object.keys(registry).toSorted(),
    );
    expect(Object.keys(payloads).toSorted()).toEqual(
      Object.keys(registry).toSorted(),
    );
  });

  it.each(Object.keys(previews) as PuzzleTypeKey[])(
    "%s renders from its parsed payload alone",
    (key) => {
      const payload = getPuzzleModule(key).schema.payloadSchema.parse(
        payloads[key],
      );
      const markup = renderToStaticMarkup(
        createElement(previews[key] as PreviewRenderer, { payload }),
      );
      expect(markup).toContain("<svg");
      expect(countElements(markup)).toBeLessThan(NODE_BUDGET);
      expect(markup).not.toContain("filter");
      expect(markup).toMatchSnapshot();
    },
  );
});
