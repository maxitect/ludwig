import { describe, expect, it } from "vitest";
import { content as unwind } from "../../../content/reverse-chess/dev-unwind";
import { content as uncaptureFixture } from "../../../content/reverse-chess/dev-knight-takes";
import { content as uniqueFixture } from "../../../content/reverse-chess/dev-pawn-push";
import { check } from "./check";
import type { Answer, Content, Payload, Solution } from "./schema";

const payload = (content: Content): Payload => ({
  mode: content.mode,
  sideToMove: content.sideToMove,
  whiteKingside: content.whiteKingside,
  whiteQueenside: content.whiteQueenside,
  blackKingside: content.blackKingside,
  blackQueenside: content.blackQueenside,
  enPassantFile: null,
  halfmove: content.halfmove,
  fullmove: content.fullmove,
  goalText: content.goal?.displayText ?? null,
  plyCount: content.solutionPlies.length,
  pieces: content.pieces,
});

const solutionOf = ({ solutionPlies, goal }: Content): Solution => ({
  plies: solutionPlies.map((authored) => ({ uncapture: null, ...authored })),
  goal: goal ? (({ displayText: _, ...params }) => params)(goal) : null,
});

const ply = (
  from: string,
  to: string,
  extra: Partial<Answer["plies"][number]> = {},
): Answer["plies"][number] => ({
  fromFile: from[0] as Answer["plies"][number]["fromFile"],
  fromRank: Number(from[1]),
  toFile: to[0] as Answer["plies"][number]["toFile"],
  toRank: Number(to[1]),
  uncapture: null,
  unpromote: false,
  special: "none",
  ...extra,
});

describe("Mode A check", () => {
  const solution = solutionOf(uniqueFixture);
  const run = (plies: Answer["plies"]) =>
    check(payload(uniqueFixture), solution, { plies }).correct;

  it("accepts the authored ply", () => {
    expect(run([ply("a5", "a6")])).toBe(true);
  });

  it("rejects a legal-looking move that leaves the non-moving side in check", () => {
    expect(run([ply("c5", "b4")])).toBe(false);
  });

  it("rejects a move whose destination is empty", () => {
    expect(run([ply("a5", "a7")])).toBe(false);
  });

  it("rejects the authored move with an extra uncapture", () => {
    expect(run([ply("a5", "a6", { uncapture: "knight" })])).toBe(false);
  });

  it("rejects an empty answer and a multi-ply answer", () => {
    expect(run([])).toBe(false);
    expect(run([ply("a5", "a6"), ply("a5", "a6")])).toBe(false);
  });

  it("accepts the uncapture only with the authored piece", () => {
    const run = (uncapture: Answer["plies"][number]["uncapture"]) =>
      check(payload(uncaptureFixture), solutionOf(uncaptureFixture), {
        plies: [ply("e6", "f7", { uncapture })],
      }).correct;
    expect(run("knight")).toBe(true);
    expect(run("rook")).toBe(false);
    expect(run(null)).toBe(false);
  });

});

describe("Mode B check", () => {
  const run = (plies: Answer["plies"], goal = solutionOf(unwind).goal) =>
    check(payload(unwind), { ...solutionOf(unwind), goal }, { plies }).correct;
  const chain = [ply("h2", "h3"), ply("a7", "a6")];

  it("accepts a chain whose last prior meets the goal", () => {
    expect(run(chain)).toBe(true);
  });

  it("rejects a chain that is legal but stops short of the goal", () => {
    expect(run(chain.slice(0, 1))).toBe(false);
    expect(run([...chain, ply("g2", "g3")])).toBe(false);
  });

  it("rejects a chain whose second ply is not legal on the new prior position", () => {
    expect(run([chain[0], ply("a7", "a5")])).toBe(false);
    expect(run([chain[1], chain[0]])).toBe(false);
  });

  it("accepts any legal chain that reaches the goal, not only the authored one", () => {
    const other = {
      kind: "piece_on_square",
      colour: "white",
      piece: "pawn",
      file: "h",
      rank: 2,
    } as const;
    expect(run(chain, other)).toBe(true);
    expect(run([ply("g2", "g3"), ply("a7", "a6")], other)).toBe(false);
  });

  it("checks castling-right and piece-count goals on the final position", () => {
    expect(
      run(chain, { kind: "castling_right", colour: "white", side: "kingside" }),
    ).toBe(false);
    expect(
      run(chain, {
        kind: "piece_count",
        colour: "white",
        piece: "pawn",
        count: 8,
      }),
    ).toBe(true);
  });
});
