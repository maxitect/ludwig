import { describe, expect, it } from "vitest";
import { fromFen } from "../_shared/chess-fen";
import { checkLine, defence, keyMoves, type MoveInput } from "./engine";
import { verifyChessProblem } from "./verify";
import { contentSchema } from "./schema";

const CONNOR = "5rk1/1Q3ppp/8/8/2B2b2/5PqP/6P1/4R2K w - - 0 1";
const TWO_KEYS = "7k/6pp/8/8/8/8/8/RR2K3 w - - 0 1";

const sans = (fen: string, n: number) => keyMoves(fen, n).map((move) => move.san);
const line = (...moves: string[]): MoveInput[] =>
  moves.map((move) => ({
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move[4],
  }));

describe("keyMoves", () => {
  it("finds the one key of the Connor problem", () => {
    expect(sans(CONNOR, 2)).toEqual(["Qxf7+"]);
  });

  it("finds no mate in 1 in the Connor problem", () => {
    expect(keyMoves(CONNOR, 1)).toEqual([]);
  });

  it("finds both mates of a position with two keys", () => {
    expect(sans(TWO_KEYS, 1).toSorted()).toEqual(["Ra8#", "Rb8#"]);
  });
});

describe("defence", () => {
  it("answers Qxf7+ with the forced Rxf7", () => {
    const after = "5rk1/5Qpp/8/8/2B2b2/5PqP/6P1/4R2K b - - 0 1";
    expect(defence(after, 1)?.san).toBe("Rxf7");
  });

  it("is null when Black is already mated", () => {
    expect(defence("R6k/6pp/8/8/8/8/8/4K3 b - - 0 1", 1)).toBeNull();
  });

  it("prefers the reply that leaves White fewest mates, then UCI order", () => {
    const after = "5rk1/5Qpp/8/8/2B2b2/5PqP/6P1/4R2K b - - 0 1";
    const reply = defence(after, 1);
    expect(reply && `${reply.from}${reply.to}`).toBe("f8f7");
  });
});

describe("checkLine", () => {
  it("accepts the Connor line", () => {
    expect(checkLine(CONNOR, 2, line("b7f7", "f8f7", "e1e8"))).toBe(true);
  });

  it("rejects a line that starts with a non-key move", () => {
    expect(checkLine(CONNOR, 2, line("b7b8", "f8b8", "e1e8"))).toBe(false);
  });

  it("rejects a line that does not end in mate", () => {
    expect(checkLine(CONNOR, 2, line("b7f7", "f8f7"))).toBe(false);
    expect(checkLine(CONNOR, 2, line("b7f7", "f8f7", "e1e7"))).toBe(false);
  });

  it("rejects an illegal ply and a line longer than 2n - 1 plies", () => {
    expect(checkLine(CONNOR, 2, line("b7f7", "f8f7", "e1e9"))).toBe(false);
    expect(checkLine(TWO_KEYS, 1, line("a1a8", "h8g8", "a8a7"))).toBe(false);
  });

  it("accepts any key of a position with two keys", () => {
    expect(checkLine(TWO_KEYS, 1, line("a1a8"))).toBe(true);
    expect(checkLine(TWO_KEYS, 1, line("b1b8"))).toBe(true);
  });
});

describe("verify", () => {
  const content = (fen: string, mateIn: number) =>
    contentSchema.parse({ fen, mateIn });

  it("accepts the Connor problem", () => {
    expect(() => verifyChessProblem(content(CONNOR, 2))).not.toThrow();
  });

  it("rejects a position with two keys", () => {
    expect(() => verifyChessProblem(content(TWO_KEYS, 1))).toThrow(
      /exactly 1 key move, found 2/,
    );
  });

  it("rejects a mate in 2 that is really a mate in 1", () => {
    expect(() => verifyChessProblem(content(TWO_KEYS, 2))).toThrow(/mates in 1/);
  });

  it("rejects a position with no key", () => {
    expect(() =>
      verifyChessProblem(content("7k/6pp/8/8/8/8/8/4K3 w - - 0 1", 1)),
    ).toThrow(/found 0/);
  });

  it("rejects a position where Black is already in check", () => {
    expect(() =>
      verifyChessProblem(content("R6k/6pp/8/8/8/8/8/4K3 w - - 0 1", 1)),
    ).toThrow(/Black is in check/);
  });
});

describe("content fen", () => {
  it("parses a FEN into piece rows and rights", () => {
    const parsed = contentSchema.parse({ fen: CONNOR, mateIn: 2 });
    expect(parsed.pieces).toHaveLength(fromFen(CONNOR).pieces.length);
    expect(parsed.whiteKingside).toBe(false);
    expect(parsed.enPassantFile).toBeNull();
  });

  it("rejects Black to move and a malformed FEN", () => {
    expect(
      contentSchema.safeParse({ fen: CONNOR.replace(" w ", " b "), mateIn: 2 }).success,
    ).toBe(false);
    expect(contentSchema.safeParse({ fen: "8/8/8 w - - 0 1", mateIn: 1 }).success).toBe(false);
  });

  it("rejects mate in 3", () => {
    expect(contentSchema.safeParse({ fen: CONNOR, mateIn: 3 }).success).toBe(false);
  });
});

describe("speed", () => {
  it("solves a mate in 2 in well under 200 ms", () => {
    const start = performance.now();
    keyMoves(CONNOR, 2);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
