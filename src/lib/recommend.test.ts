import { describe, expect, it } from "vitest";
import {
  recommend,
  type Candidate,
  type RecommendInput,
  type TypeActivity,
  type TypeDifficultyStats,
  type TypeStats,
} from "@/lib/recommend";

const TODAY = "2026-11-11";

const candidate = (
  typeKey: string,
  difficulty: number,
  categoryKey = "logic",
  slug = `${typeKey}-${difficulty}`,
): Candidate => ({
  id: slug,
  typeKey,
  typeName: typeKey[0].toUpperCase() + typeKey.slice(1),
  categoryKey,
  categoryName: categoryKey === "logic" ? "Logic" : "Word",
  slug,
  title: slug,
  difficulty,
});

const activity = (
  typeKey: string,
  overrides: Partial<TypeActivity> = {},
): TypeActivity => ({
  typeKey,
  categoryKey: "logic",
  firstDay: "2026-11-01",
  lastDay: "2026-11-10",
  activeDays: 2,
  started: 2,
  completed: 2,
  unfinished: 0,
  staleUnfinished: 0,
  returnsAfterSolve: 0,
  ...overrides,
});

const stats = (
  typeKey: string,
  overrides: Partial<TypeStats> = {},
): TypeStats => ({
  typeKey,
  categoryKey: "logic",
  solves: 2,
  medianDurationMs: 60_000,
  avgHints: 0,
  ...overrides,
});

const solvedAt = (
  typeKey: string,
  difficulty: number,
  solves = 2,
  medianDurationMs = 60_000,
): TypeDifficultyStats => ({ typeKey, difficulty, solves, medianDurationMs });

function shelf(input: Partial<RecommendInput> & { candidates: Candidate[] }) {
  return recommend({
    today: TODAY,
    activity: [],
    stats: [],
    byDifficulty: [],
    favouriteTypeKeys: [],
    solvedPuzzleIds: [],
    popularTypeKeys: [],
    ...input,
  });
}

/** The score of the only candidate of a type, with everything else held equal. */
function scoreOf(
  typeKey: string,
  input: Partial<RecommendInput> & { candidates?: Candidate[] },
) {
  const { picks } = shelf({
    candidates: [candidate(typeKey, 3)],
    ...input,
  });
  return picks.find((pick) => pick.typeKey === typeKey)!;
}

const baseline = {
  activity: [activity("a")],
  stats: [stats("a")],
  byDifficulty: [solvedAt("a", 1)],
};

describe("positive signals", () => {
  it("favourite type scores strongly and gives its reason", () => {
    const pick = scoreOf("a", { ...baseline, favouriteTypeKeys: ["a"] });
    const plain = scoreOf("a", baseline);
    expect(pick.score - plain.score).toBe(40);
    expect(pick.reason).toBe("Because you favourited A");
  });

  it("played type scores per solve, capped", () => {
    const one = scoreOf("a", { ...baseline, stats: [stats("a", { solves: 1 })] });
    const two = scoreOf("a", baseline);
    const many = scoreOf("a", { ...baseline, stats: [stats("a", { solves: 9 })] });
    expect(two.score - one.score).toBe(4);
    expect(many.score - two.score).toBe(12);
  });

  it("a short median time against the other types is a bonus", () => {
    const input = {
      activity: [activity("a"), activity("b")],
      stats: [stats("a"), stats("b")],
    };
    const fast = scoreOf("a", {
      ...input,
      byDifficulty: [solvedAt("a", 1, 2, 30_000), solvedAt("b", 1, 2, 60_000)],
    });
    const level = scoreOf("a", {
      ...input,
      byDifficulty: [solvedAt("a", 1, 2, 60_000), solvedAt("b", 1, 2, 60_000)],
    });
    expect(fast.score - level.score).toBe(8);
  });

  it("difficulty one above the median solved is a step up", () => {
    const stepUp = scoreOf("a", {
      ...baseline,
      byDifficulty: [solvedAt("a", 2)],
    });
    const same = scoreOf("a", baseline);
    expect(stepUp.score - same.score).toBe(10);
    expect(stepUp.reason).toBe("A step up from your A puzzles");
  });

  it("an unplayed type is a step up at difficulty 2", () => {
    const two = shelf({
      ...baseline,
      candidates: [candidate("b", 2), candidate("b", 3)],
    }).picks;
    expect(two.map((pick) => pick.slug)).toEqual(["b-2", "b-3"]);
    expect(two[0].score - two[1].score).toBe(10);
  });

  it("an unplayed type in the most-played category is discovery", () => {
    const { picks } = shelf({
      ...baseline,
      candidates: [candidate("b", 3, "logic"), candidate("c", 3, "word")],
    });
    expect(picks[0]).toMatchObject({
      typeKey: "b",
      score: 12,
      reason: "Something new in Logic",
    });
    expect(picks[1].score).toBe(0);
  });

  it("a type played in the last 14 days scores above one that is not", () => {
    const recent = scoreOf("a", baseline);
    const older = scoreOf("a", {
      ...baseline,
      activity: [activity("a", { lastDay: "2026-10-20" })],
    });
    expect(recent.score - older.score).toBe(8);
  });

  it("comeback rate: returning on five days beats trying once", () => {
    const keen = scoreOf("keen", {
      activity: [
        activity("keen", { firstDay: "2026-11-01", activeDays: 6 }),
        activity("once", { firstDay: "2026-11-01", activeDays: 1 }),
      ],
    });
    const once = scoreOf("once", {
      activity: [
        activity("keen", { firstDay: "2026-11-01", activeDays: 6 }),
        activity("once", { firstDay: "2026-11-01", activeDays: 1 }),
      ],
    });
    expect(keen.score - once.score).toBe(15);
    expect(keen.reason).toBe("You keep coming back to Keen");
  });

  it("a return after a solve counts for more than a plain revisit", () => {
    const withReturn = scoreOf("a", {
      ...baseline,
      activity: [activity("a", { returnsAfterSolve: 2 })],
    });
    expect(withReturn.score - scoreOf("a", baseline).score).toBe(10);
  });
});

describe("negative signals", () => {
  const worse = (overrides: Partial<TypeActivity>) =>
    scoreOf("a", { ...baseline, activity: [activity("a", overrides)] });
  const base = scoreOf("a", baseline).score;

  it("each unfinished attempt and the abandonment ratio count against", () => {
    expect(base - worse({ started: 4, unfinished: 2 }).score).toBe(
      2 * 6 + 20 * 0.5,
    );
  });

  it("an unfinished attempt untouched for over 7 days counts against", () => {
    expect(
      base - worse({ started: 3, unfinished: 1, staleUnfinished: 1 }).score,
    ).toBe(6 + 20 * (1 / 3) + 8);
  });

  it("hints well above the category average count against", () => {
    const input = {
      activity: [activity("a"), activity("b")],
      stats: [stats("a", { avgHints: 4 }), stats("b", { avgHints: 0 })],
      byDifficulty: [solvedAt("a", 1), solvedAt("b", 1)],
    };
    const hinty = scoreOf("a", input);
    const calm = scoreOf("a", {
      ...input,
      stats: [stats("a", { avgHints: 0 }), stats("b", { avgHints: 0 })],
    });
    expect(calm.score - hinty.score).toBe(10);
  });

  it("a median over twice the other types at the same difficulty counts against", () => {
    const input = {
      activity: [activity("a"), activity("b")],
      stats: [stats("a"), stats("b")],
    };
    const slow = scoreOf("a", {
      ...input,
      byDifficulty: [solvedAt("a", 1, 2, 150_000), solvedAt("b", 1, 2, 60_000)],
    });
    const level = scoreOf("a", {
      ...input,
      byDifficulty: [solvedAt("a", 1, 2, 60_000), solvedAt("b", 1, 2, 60_000)],
    });
    expect(level.score - slow.score).toBe(15);
  });

  it("a type tried once, long ago, never returned to counts against", () => {
    const old = {
      firstDay: "2026-08-01",
      lastDay: "2026-08-01",
      activeDays: 1,
      started: 1,
    };
    const input = { ...baseline };
    const lastWeek = scoreOf("a", {
      ...input,
      activity: [activity("a", { ...old, lastDay: "2026-11-05" })],
    });
    const longAgo = scoreOf("a", {
      ...input,
      activity: [activity("a", { ...old, lastDay: "2026-10-01" })],
    });
    expect(lastWeek.score - longAgo.score).toBe(8 + 15);
  });

  it("a type idle over 60 days counts against unless it is a favourite", () => {
    const idle = { firstDay: "2026-06-01", lastDay: "2026-08-01" };
    const active = scoreOf("a", {
      ...baseline,
      activity: [activity("a", { ...idle, lastDay: "2026-10-01" })],
    });
    const dormant = scoreOf("a", {
      ...baseline,
      activity: [activity("a", idle)],
    });
    const favourite = scoreOf("a", {
      ...baseline,
      activity: [activity("a", idle)],
      favouriteTypeKeys: ["a"],
    });
    expect(active.score - dormant.score).toBe(20);
    expect(favourite.score - dormant.score).toBe(40 + 20);
  });

  it("three unfinished attempts rank below an untried type of the same category", () => {
    const { picks } = shelf({
      activity: [
        activity("a", { started: 3, completed: 0, unfinished: 3 }),
        activity("z", { started: 5, completed: 5 }),
      ],
      stats: [stats("z")],
      byDifficulty: [solvedAt("z", 1)],
      candidates: [candidate("a", 3), candidate("b", 3)],
    });
    expect(picks.map((pick) => pick.typeKey)).toEqual(["b", "a"]);
  });
});

describe("exclusions and ordering", () => {
  it("never returns a solved puzzle", () => {
    const { picks } = shelf({
      ...baseline,
      solvedPuzzleIds: ["a-3"],
      candidates: [candidate("a", 3), candidate("a", 4)],
    });
    expect(picks.map((pick) => pick.id)).toEqual(["a-4"]);
  });

  it("breaks ties by slug", () => {
    const { picks } = shelf({
      ...baseline,
      candidates: [
        candidate("b", 4, "word", "zeta"),
        candidate("c", 4, "word", "alpha"),
        candidate("d", 4, "word", "mid"),
      ],
    });
    expect(picks.map((pick) => pick.slug)).toEqual(["alpha", "mid", "zeta"]);
  });

  it("takes six, at most two per type", () => {
    const { picks } = shelf({
      ...baseline,
      favouriteTypeKeys: ["a"],
      candidates: [
        ...[1, 2, 3, 4, 5].map((difficulty) => candidate("a", difficulty)),
        ...["b", "c", "d", "e", "f", "g"].map((key) => candidate(key, 4, "word")),
      ],
    });
    expect(picks).toHaveLength(6);
    expect(picks.filter((pick) => pick.typeKey === "a")).toHaveLength(2);
  });
});

describe("cold start", () => {
  const catalogue = ["a", "b", "c", "d", "e", "f", "g"].flatMap((key) => [
    candidate(key, 3),
    candidate(key, 2),
    candidate(key, 1),
  ]);

  it("one easy puzzle from each of the six most popular types", () => {
    const { coldStart, picks } = shelf({
      candidates: catalogue,
      popularTypeKeys: ["g", "f", "e", "d", "c", "b", "a"],
    });
    expect(coldStart).toBe(true);
    expect(picks.map((pick) => pick.slug)).toEqual([
      "g-1",
      "f-1",
      "e-1",
      "d-1",
      "c-1",
      "b-1",
    ]);
    expect(picks.every((pick) => pick.reason === "Popular start")).toBe(true);
  });

  it("skips a popular type with nothing easy left", () => {
    const { picks } = shelf({
      candidates: [candidate("a", 4), candidate("b", 2)],
      popularTypeKeys: ["a", "b"],
    });
    expect(picks.map((pick) => pick.slug)).toEqual(["b-2"]);
  });

  it("is not used once the player has a favourite", () => {
    const { coldStart } = shelf({
      candidates: catalogue,
      favouriteTypeKeys: ["a"],
      popularTypeKeys: ["g"],
    });
    expect(coldStart).toBe(false);
  });
});
