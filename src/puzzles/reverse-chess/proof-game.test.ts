import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { content as fourSteps } from "../../../content/reverse-chess/four-steps";
import { content as longWalk } from "../../../content/reverse-chess/the-long-walk";
import { content as twoPromotions } from "../../../content/reverse-chess/two-promotions";
import { check } from "./check";
import { fromFen } from "./derive";
import { solutionSchema, type Answer, type Content, type Payload } from "./schema";
import { verifyReverseChess } from "./verify";

const PROOF_GAMES = { fourSteps, twoPromotions, longWalk };

const payloadOf = (content: Content): Payload => ({
  mode: content.mode,
  sideToMove: content.sideToMove,
  whiteKingside: content.whiteKingside,
  whiteQueenside: content.whiteQueenside,
  blackKingside: content.blackKingside,
  blackQueenside: content.blackQueenside,
  enPassantFile: content.enPassantFile ?? null,
  halfmove: content.halfmove,
  fullmove: content.fullmove,
  goalText: content.goal?.displayText ?? null,
  plyCount: content.solutionPlies.length,
  pieces: content.pieces,
});

const answerOf = (content: Content): Answer["plies"] =>
  content.solutionPlies.map((ply) => ({ uncapture: null, ...ply }));

const solutionOf = (content: Content) => ({
  plies: answerOf(content),
  goal: solutionSchema.shape.goal.parse({ kind: "initial_position" }),
});

const run = (content: Content, plies: Answer["plies"], shown = payloadOf(content)) =>
  check(shown, solutionOf(content), { plies }).correct;

describe("check for an initial_position goal", () => {
  for (const [name, content] of Object.entries(PROOF_GAMES)) {
    it(`accepts the authored chain of ${name}`, () => {
      expect(run(content, answerOf(content))).toBe(true);
    });
  }

  it("rejects a chain one ply short", () => {
    expect(run(twoPromotions, answerOf(twoPromotions).slice(0, -1))).toBe(false);
  });

  it("rejects a chain with an illegal step", () => {
    const plies = answerOf(twoPromotions);
    plies[2] = { ...plies[2], toRank: 4 };
    expect(run(twoPromotions, plies)).toBe(false);
  });

  it("rejects an uncapture that differs from the game", () => {
    const plies = answerOf(twoPromotions);
    const index = plies.findIndex((ply) => ply.uncapture);
    plies[index] = { ...plies[index], uncapture: "rook" };
    expect(run(twoPromotions, plies)).toBe(false);
  });

  it("rejects a chain that reaches the starting placement but not the position's castling rights", () => {
    const shown = { ...payloadOf(twoPromotions), whiteKingside: false };
    expect(run(twoPromotions, answerOf(twoPromotions), shown)).toBe(false);
  });

  it("rejects a chain when the position claims an en passant file the game does not leave", () => {
    const shown = { ...payloadOf(fourSteps), enPassantFile: "d" as const };
    expect(run(fourSteps, answerOf(fourSteps), shown)).toBe(false);
  });
});

describe("verifyReverseChess for an initial_position goal", () => {
  for (const [name, content] of Object.entries(PROOF_GAMES)) {
    it(`accepts ${name}`, () => {
      expect(() => verifyReverseChess(content)).not.toThrow();
    });

    it(`rejects ${name} with one authored ply changed`, () => {
      const plies = [...content.solutionPlies];
      plies[1] = { ...plies[1], toRank: plies[1].toRank === 8 ? 7 : plies[1].toRank + 1 };
      expect(() => verifyReverseChess({ ...content, solutionPlies: plies })).toThrow();
    });
  }

  it("rejects a puzzle whose number of plies disagrees with its move number", () => {
    expect(() =>
      verifyReverseChess({ ...fourSteps, solutionPlies: fourSteps.solutionPlies.slice(1) }),
    ).toThrow(/needs 8 plies/);
  });

  it("rejects a game that can be reached by two move orders", () => {
    const chess = new Chess();
    const history = ["Nf3", "Nf6", "Nc3", "Nc6"].map((san) => chess.move(san));
    const position = fromFen(chess.fen());
    const ambiguous: Content = {
      ...fourSteps,
      ...position,
      enPassantFile: undefined,
      fullmove: 3,
      sideToMove: "white",
      pieces: position.pieces,
      solutionPlies: history.reverse().map((move) => ({
        fromFile: move.from[0] as Content["solutionPlies"][number]["fromFile"],
        fromRank: Number(move.from[1]),
        toFile: move.to[0] as Content["solutionPlies"][number]["toFile"],
        toRank: Number(move.to[1]),
        unpromote: false,
        special: "none",
      })),
    };
    expect(() => verifyReverseChess(ambiguous)).toThrow(/found at least 2/);
  });
});
