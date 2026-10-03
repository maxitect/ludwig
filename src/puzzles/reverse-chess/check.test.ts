import { describe, expect, it } from "vitest";
import { content as unwind } from "../../../content/reverse-chess/dev-unwind";
import { content as uncaptureFixture } from "../../../content/reverse-chess/dev-knight-takes";
import { content as uniqueFixture } from "../../../content/reverse-chess/dev-pawn-push";
import { check } from "./check";
import type { Answer, Content, Payload, SolutionPly } from "./schema";

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
  goalText: content.goalText ?? null,
  plyCount: content.solutionPlies.length,
  pieces: content.pieces,
});

const solutionOf = (content: Content): SolutionPly[] =>
  content.solutionPlies.map((authored) => ({ uncapture: null, ...authored }));

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

  it("does not check Mode B puzzles yet", () => {
    expect(() =>
      check(payload(unwind), [], { plies: [ply("h2", "h3")] }),
    ).toThrow();
  });
});
