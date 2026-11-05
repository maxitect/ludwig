import { describe, expect, it } from "vitest";
import { content as scene } from "../../../content/detective-scene/cambridge-night";
import type { Content } from "./schema";
import { testScene } from "./test-content";
import { MIN_SCENE_TITLES, verifyDetectiveScene } from "./verify";

const fixture: Content = { ...testScene, sceneKey: "cambridge-night" };

const item = (overrides: Partial<Content["items"][number]>) => ({
  title: "Taggart",
  x: 700,
  y: 600,
  width: 100,
  height: 50,
  aliases: [],
  ...overrides,
});
const withItems = (...items: Content["items"]): Content => ({
  ...fixture,
  items: [...fixture.items, ...items],
});

describe("verifyDetectiveScene", () => {
  it("accepts the real scene", () => {
    expect(() => verifyDetectiveScene(scene)).not.toThrow();
    expect(scene.items.length).toBeGreaterThanOrEqual(MIN_SCENE_TITLES);
  });

  it("keeps every region of the real scene reachable on the keyboard sector grid", () => {
    const sector = 30;
    for (const { title, width, height } of scene.items) {
      expect(Math.min(width, height), title).toBeGreaterThanOrEqual(sector);
    }
  });

  it("rejects a scene with fewer titles than the minimum", () => {
    expect(() => verifyDetectiveScene(fixture)).toThrow(/at least 30 titles/);
    expect(() =>
      verifyDetectiveScene({
        ...scene,
        items: scene.items.slice(0, MIN_SCENE_TITLES - 1),
      }),
    ).toThrow(/hides 29/);
    expect(() =>
      verifyDetectiveScene({
        ...scene,
        items: scene.items.slice(0, MIN_SCENE_TITLES),
      }),
    ).not.toThrow();
  });

  it("rejects an unknown scene key", () => {
    expect(() =>
      verifyDetectiveScene({ ...fixture, sceneKey: "nowhere" }),
    ).toThrow(/unknown scene "nowhere"/);
  });

  it("rejects a size that differs from the registry", () => {
    expect(() => verifyDetectiveScene({ ...fixture, width: 1000 })).toThrow(
      /registry says 1200x800/,
    );
  });

  it.each([
    ["past the right edge", { x: 1150 }],
    ["past the bottom edge", { y: 770 }],
  ])("rejects a region %s", (_, override) => {
    expect(() => verifyDetectiveScene(withItems(item(override)))).toThrow(
      /item 3 lies outside the scene/,
    );
  });

  it("rejects overlapping regions", () => {
    expect(() =>
      verifyDetectiveScene(withItems(item({ x: 150, y: 480 }))),
    ).toThrow(/items 0 and 3 overlap/);
  });

  it("passes the overlap check for regions with a gap between them", () => {
    expect(() =>
      verifyDetectiveScene(withItems(item({ x: 381, y: 470 }))),
    ).toThrow(/at least 30 titles/);
  });

  it("rejects duplicate titles after normalising", () => {
    expect(() =>
      verifyDetectiveScene(withItems(item({ title: "the SWEENEY!" }))),
    ).toThrow(/duplicates a name of item 0/);
    expect(() =>
      verifyDetectiveScene(withItems(item({ title: "Starsky and Hutch" }))),
    ).toThrow(/duplicates a name of item 1/);
  });

  it("rejects an alias that duplicates a title or another alias", () => {
    expect(() =>
      verifyDetectiveScene(withItems(item({ aliases: ["Sweeney"] }))),
    ).toThrow(/duplicates a name of item 0/);
    expect(() =>
      verifyDetectiveScene(withItems(item({ aliases: ["morse"] }))),
    ).toThrow(/duplicates a name of item 2/);
    expect(() =>
      verifyDetectiveScene(
        withItems(item({ aliases: ["Taggart", "the taggart"] })),
      ),
    ).toThrow(/duplicates/);
  });

  it("rejects a name with no letters", () => {
    expect(() =>
      verifyDetectiveScene(withItems(item({ title: "!!!" }))),
    ).toThrow(/no letters/);
  });
});
