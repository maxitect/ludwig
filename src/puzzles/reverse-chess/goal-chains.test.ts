import { describe, expect, it } from "vitest";
import { satisfiesGoal } from "./derive";
import {
  applyRetro,
  enumerateRetro,
  retroKey,
  stepRetro,
  type Retro,
} from "./engine";
import type { Goal } from "./schema";
import { goalChains } from "./verify";

const text = { displayText: "goal" } as const;
const onSquare = (
  colour: "white" | "black",
  piece: Extract<Goal, { kind: "piece_on_square" }>["piece"],
  file: Extract<Goal, { kind: "piece_on_square" }>["file"],
  rank: number,
): Goal => ({ kind: "piece_on_square", ...text, colour, piece, file, rank });
const count = (
  colour: "white" | "black",
  piece: Extract<Goal, { kind: "piece_count" }>["piece"],
  total: number,
): Goal => ({ kind: "piece_count", ...text, colour, piece, count: total });
const right = (
  colour: "white" | "black",
  side: "kingside" | "queenside",
): Goal => ({ kind: "castling_right", ...text, colour, side });

/** The search `goalChains` replaced: every chain, no pruning, no memo. */
function exhaustiveChains(fen: string, length: number, goal: Goal) {
  const found: Retro[][] = [];
  const walk = (position: string, chain: Retro[]) => {
    if (chain.length === length) {
      if (satisfiesGoal(position, goal)) found.push(chain);
      return;
    }
    for (const retro of enumerateRetro(position)) {
      const result = applyRetro(position, retro);
      if (result.ok) walk(result.prior, [...chain, retro]);
    }
  };
  walk(fen, []);
  return found;
}

const keys = (chains: Retro[][]) =>
  chains.map((chain) => chain.map(retroKey).join(" ")).sort();

const MIDDLEGAME =
  "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2PBPN2/PP1N1PPP/R2Q1RK1 b - - 0 8";
const BLOCKED = "7k/p7/P7/8/8/8/p7/K7 w - - 0 1";
const PAWN_STORM = "4k3/1p6/pP6/P7/8/8/6pp/4K3 b - - 0 1";
const EN_PASSANT = "4k3/8/8/8/8/3p4/8/4K3 w - - 0 1";
const CASTLED = "4k3/8/8/8/8/8/8/5RK1 b - - 1 1";
const BLACK_CASTLED = "r4rk1/8/8/8/8/8/8/4K3 w - - 0 1";
const PROMOTED = "4Q3/8/8/8/8/8/8/k3K3 b - - 0 1";
const CAPTURE = "4k3/5N2/8/8/8/8/8/4K3 b - - 0 1";
const FULL_PAWNS = "4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 b - - 0 1";
const KNIGHTS = "1n2k3/8/8/8/8/8/8/4K1N1 w - - 0 1";

const CASES: [name: string, fen: string, goal: Goal, depth: number][] = [
  ["middlegame pawn home", MIDDLEGAME, onSquare("black", "pawn", "a", 7), 2],
  ["middlegame knight home", MIDDLEGAME, onSquare("white", "knight", "b", 1), 2],
  ["middlegame castling right", MIDDLEGAME, right("white", "kingside"), 2],
  ["middlegame queen count", MIDDLEGAME, count("white", "queen", 2), 2],
  ["middlegame pawn count", MIDDLEGAME, count("black", "pawn", 8), 2],
  ["middlegame depth one", MIDDLEGAME, onSquare("white", "bishop", "f", 4), 1],
  ["blocked pawn square", BLOCKED, onSquare("black", "pawn", "a", 7), 2],
  ["blocked king square", BLOCKED, onSquare("white", "king", "b", 2), 2],
  ["blocked unreachable", BLOCKED, onSquare("white", "knight", "h", 8), 2],
  ["pawn storm square", PAWN_STORM, onSquare("white", "pawn", "b", 3), 2],
  ["pawn storm count", PAWN_STORM, count("black", "pawn", 5), 2],
  ["en passant square", EN_PASSANT, onSquare("black", "pawn", "e", 4), 2],
  ["en passant pawn count", EN_PASSANT, count("white", "pawn", 1), 2],
  ["white castle right", CASTLED, right("white", "kingside"), 2],
  ["white castle rook home", CASTLED, onSquare("white", "rook", "h", 1), 2],
  ["black castle right", BLACK_CASTLED, right("black", "queenside"), 2],
  ["unpromote pawn square", PROMOTED, onSquare("white", "pawn", "e", 7), 2],
  ["unpromote queen count", PROMOTED, count("white", "queen", 0), 2],
  ["uncapture piece count", CAPTURE, count("black", "pawn", 1), 2],
  ["uncapture queen count", CAPTURE, count("black", "queen", 1), 2],
  ["full pawns uncapture", FULL_PAWNS, count("white", "knight", 1), 2],
  ["full pawns king square", FULL_PAWNS, onSquare("white", "king", "d", 1), 2],
  ["knight square", KNIGHTS, onSquare("black", "knight", "b", 8), 2],
  ["knight route", KNIGHTS, onSquare("black", "knight", "a", 6), 2],
];

describe("goalChains", () => {
  it.each(CASES)(
    "AC1: matches the exhaustive search: %s",
    (_name, fen, goal, depth) => {
      const pruned = goalChains(fen, depth, goal, Infinity);
      expect(keys(pruned)).toEqual(keys(exhaustiveChains(fen, depth, goal)));
    },
  );

  it("AC1: matches the exhaustive search at every depth up to 3", { timeout: 60_000 }, () => {
    for (const depth of [1, 2, 3]) {
      const goal = onSquare("black", "pawn", "a", 7);
      expect(keys(goalChains(BLOCKED, depth, goal, Infinity))).toEqual(
        keys(exhaustiveChains(BLOCKED, depth, goal)),
      );
    }
  });

  it("AC1: covers en passant, castling, uncapture and unpromotion chains", () => {
    const kinds = new Set<string>();
    const note = (fen: string, goal: Goal, depth: number) => {
      for (const chain of goalChains(fen, depth, goal, Infinity)) {
        for (const retro of chain) {
          if (retro.special) kinds.add(retro.special);
          if (retro.uncapture) kinds.add("uncapture");
          if (retro.unpromote) kinds.add("unpromote");
        }
      }
    };
    note(EN_PASSANT, count("white", "pawn", 1), 1);
    note(CASTLED, right("white", "kingside"), 1);
    note(CAPTURE, count("black", "pawn", 1), 1);
    note(PROMOTED, onSquare("white", "pawn", "e", 7), 1);
    expect([...kinds].sort()).toEqual([
      "castle",
      "en_passant",
      "uncapture",
      "unpromote",
    ]);
  });

  it("stops after the limit", () => {
    const goal = count("black", "king", 1);
    expect(goalChains(MIDDLEGAME, 2, goal, 2)).toHaveLength(2);
  });
});

describe("enumerateRetro", () => {
  it("accepts exactly the retro moves that stepRetro accepts", () => {
    const squares = "abcdefgh"
      .split("")
      .flatMap((file) => [1, 2, 3, 4, 5, 6, 7, 8].map((r) => `${file}${r}`));
    for (const fen of [EN_PASSANT, CASTLED, BLACK_CASTLED, PROMOTED, KNIGHTS]) {
      const listed = new Set(enumerateRetro(fen).map(retroKey));
      const occupied = fen
        .split(" ")[0]
        .split("/")
        .flatMap((row, i) => {
          const cells: string[] = [];
          let file = 0;
          for (const char of row) {
            if (/\d/.test(char)) file += Number(char);
            else cells.push(`${"abcdefgh"[file++]}${8 - i}`);
          }
          return cells;
        });
      for (const to of occupied) {
        for (const from of squares) {
          for (const uncapture of [undefined, "q", "r", "b", "n", "p"] as const) {
            for (const extra of [
              {},
              { unpromote: true },
              { special: "en_passant" },
              { special: "castle" },
            ] as const) {
              const retro: Retro = { from, to, uncapture, ...extra } as Retro;
              const key = retroKey(retro);
              const accepted = stepRetro(fen, retro).ok;
              if (accepted) expect(listed.has(key), `${fen} ${key}`).toBe(true);
            }
          }
        }
      }
    }
  });
});
