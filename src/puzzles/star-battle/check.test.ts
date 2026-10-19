import { describe, expect, it } from "vitest";
import { content as doubleBill } from "../../../content/star-battle/double-bill";
import { content as firstLight } from "../../../content/star-battle/first-light";
import { layoutOf, solve } from "./engine";
import { check } from "./check";
import type { Content, Payload } from "./schema";
import { regionCells } from "./verify";

const payloadOf = (content: Content): Payload => ({
  size: content.size,
  stars: content.stars,
  regions: regionCells(content),
});

const starsOf = (payload: Payload) =>
  (solve(layoutOf(payload)) ?? []).map((index) => ({
    row: Math.floor(index / payload.size),
    col: index % payload.size,
  }));

describe("check", () => {
  const payload = payloadOf(doubleBill);
  const solved = starsOf(payload);

  it("accepts the solution at two stars", () => {
    expect(solved).toHaveLength(16);
    expect(check(payload, [], { stars: solved })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("accepts the solution at one star", () => {
    const one = payloadOf(firstLight);
    const stars = starsOf(one);
    expect(stars).toHaveLength(6);
    expect(check(one, [], { stars }).correct).toBe(true);
  });

  it("rejects an answer that is one star short", () => {
    const result = check(payload, [], { stars: solved.slice(1) });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual([]);
  });

  it("rejects diagonally touching stars and names both cells", () => {
    const [first, ...rest] = solved;
    const touching = { row: first.row + 1, col: first.col + 1 };
    const result = check(payload, [], {
      stars: [first, touching, ...rest.filter(
        (star) => star.row !== touching.row || star.col !== touching.col,
      )],
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual(
      expect.arrayContaining([first, touching]),
    );
  });

  it("names every star of a row, column or region that holds too many", () => {
    const one = payloadOf(firstLight);
    const stars = starsOf(one);
    const crowded = [...stars, { row: stars[0].row, col: (stars[0].col + 3) % 6 }];
    const result = check(one, [], { stars: crowded });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual(
      expect.arrayContaining([stars[0], crowded.at(-1)]),
    );
  });

  it("fails every single-star perturbation of the solution", () => {
    for (const [i, moved] of solved.entries()) {
      for (const shift of [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ]) {
        const to = {
          row: (moved.row + shift.row) % payload.size,
          col: (moved.col + shift.col) % payload.size,
        };
        const stars = solved.map((star, at) => (at === i ? to : star));
        expect(check(payload, [], { stars }).correct).toBe(false);
      }
    }
  });
});
