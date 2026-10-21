import { describe, expect, it } from "vitest";
import { check } from "./check";
import { matchFind, normaliseTitle } from "./engine";
import type { Payload, Solution } from "./schema";

const solution: Solution = {
  items: [
    { position: 0, title: "The Sweeney", x: 10, y: 10, width: 40, height: 20 },
    {
      position: 1,
      title: "Starsky & Hutch",
      x: 100,
      y: 10,
      width: 40,
      height: 20,
    },
    { position: 2, title: "Poirot", x: 200, y: 100, width: 30, height: 30 },
  ],
  aliases: [
    { position: 2, alias: "Agatha Christie's Poirot" },
    { position: 1, alias: "S&H" },
  ],
};
const { items, aliases } = solution;
const inSweeney = { x: 30, y: 20 };

describe("normaliseTitle", () => {
  it.each([
    ["The Sweeney", "sweeney"],
    ["the sweeney", "sweeney"],
    ["THE SWEENEY!", "sweeney"],
    ["  Sweeney ", "sweeney"],
    ["Starsky & Hutch", "starsky and hutch"],
    ["Starsky and Hutch", "starsky and hutch"],
    ["Starsky&Hutch", "starsky and hutch"],
    ["Cadfael's  Café", "cadfaels cafe"],
    ["Line-of-Duty", "line of duty"],
    ["Theodore", "theodore"],
    ["The", ""],
    ["...", ""],
  ])("turns %j into %j", (typed, expected) => {
    expect(normaliseTitle(typed)).toBe(expected);
  });
});

describe("matchFind", () => {
  it.each(["the sweeney", "Sweeney", "THE SWEENEY!", "The Sweeney"])(
    "matches %j to The Sweeney inside its region",
    (typed) => {
      expect(matchFind(items, aliases, inSweeney, typed)).toBe(0);
    },
  );

  it("matches Starsky & Hutch typed with and", () => {
    expect(
      matchFind(items, aliases, { x: 120, y: 20 }, "Starsky and Hutch"),
    ).toBe(1);
  });

  it("does not match a correct title tapped outside its region", () => {
    expect(matchFind(items, aliases, { x: 60, y: 20 }, "The Sweeney")).toBeNull();
    expect(
      matchFind(items, aliases, { x: 120, y: 20 }, "The Sweeney"),
    ).toBeNull();
  });

  it("does not match a wrong title inside a region", () => {
    expect(matchFind(items, aliases, inSweeney, "Taggart")).toBeNull();
    expect(matchFind(items, aliases, inSweeney, "")).toBeNull();
    expect(matchFind(items, aliases, inSweeney, "the")).toBeNull();
  });

  it("matches an alias, and only inside its own item", () => {
    expect(
      matchFind(items, aliases, { x: 210, y: 110 }, "agatha christies poirot"),
    ).toBe(2);
    expect(matchFind(items, aliases, { x: 120, y: 20 }, "S & H")).toBe(1);
    expect(matchFind(items, aliases, inSweeney, "S&H")).toBeNull();
  });

  it("counts a tap on a region's edge", () => {
    expect(matchFind(items, aliases, { x: 10, y: 10 }, "Sweeney")).toBe(0);
    expect(matchFind(items, aliases, { x: 50, y: 30 }, "Sweeney")).toBe(0);
  });
});

describe("detective scene check", () => {
  const payload = {} as Payload;
  const finds = [
    { x: 30, y: 20, title: "the sweeney" },
    { x: 120, y: 20, title: "Starsky and Hutch" },
    { x: 215, y: 115, title: "Poirot" },
  ];

  it("accepts a find for every item, in any order, with extra misses", () => {
    expect(
      check(payload, solution, {
        finds: [{ x: 0, y: 0, title: "Nope" }, ...finds.toReversed()],
      }).correct,
    ).toBe(true);
  });

  it("rejects a missing find, a wrong title and a wrong place", () => {
    expect(check(payload, solution, { finds: finds.slice(1) }).correct).toBe(
      false,
    );
    expect(
      check(payload, solution, {
        finds: [{ ...finds[0], title: "Taggart" }, ...finds.slice(1)],
      }).correct,
    ).toBe(false);
    expect(
      check(payload, solution, {
        finds: [{ ...finds[0], x: 300 }, ...finds.slice(1)],
      }).correct,
    ).toBe(false);
  });

  it("does not count the same item twice", () => {
    expect(
      check(payload, solution, { finds: [finds[0], finds[0], finds[0]] })
        .correct,
    ).toBe(false);
  });
});
