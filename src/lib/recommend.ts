/**
 * The Desk's "Recommended for you" ranking. A pure function of what the player has already done, so
 * nothing about it is stored: it is recomputed on every Desk load from `user_type_activity`,
 * `user_type_stats`, per-difficulty solve medians and the favourites.
 *
 * A type's score is the sum of the weights below, so a reader can predict the shelf from them. Each
 * candidate puzzle adds its own difficulty and discovery points. Resets are not a signal: `clearState`
 * deletes the attempt rows, so there is nothing left to read.
 */

import type {
  puzzleCategories,
  puzzleTypes,
  puzzles,
  userDifficultyStats,
  userSolves,
  userTypeActivity,
  userTypeStats,
} from "@/db/schema";

export const WEIGHTS = {
  favourite: 40,
  playedPerSolve: 4,
  playedMaxSolves: 5,
  fast: 8,
  stepUp: 10,
  discovery: 12,
  recent: 8,
  comeback: 30,
  returnAfterSolvePer: 5,
  returnAfterSolveMax: 3,
  unfinishedEach: 6,
  abandonment: 20,
  staleUnfinished: 8,
  hinty: 10,
  slow: 15,
  triedOnceLongAgo: 15,
  dormant: 20,
} as const;

export const THRESHOLDS = {
  shelfSize: 6,
  perTypeCap: 2,
  recentDays: 14,
  onceLongAgoDays: 30,
  dormantDays: 60,
  fastRatio: 0.75,
  slowRatio: 2,
  hintyRatio: 1.5,
  untriedStepUpDifficulty: 2,
  coldStartMaxDifficulty: 2,
} as const;

type PuzzleType = typeof puzzleTypes.$inferSelect;
type PuzzleCategory = typeof puzzleCategories.$inferSelect;

export type TypeActivity = Omit<typeof userTypeActivity.$inferSelect, "userId"> &
  Pick<PuzzleType, "categoryKey">;

export type TypeStats = Pick<
  typeof userTypeStats.$inferSelect,
  "typeKey" | "categoryKey" | "solves" | "medianDurationMs"
> & { avgHints: number };

export type TypeDifficultyStats = Omit<
  typeof userDifficultyStats.$inferSelect,
  "userId"
> &
  Pick<typeof userSolves.$inferSelect, "typeKey">;

export type Candidate = Pick<
  typeof puzzles.$inferSelect,
  "id" | "slug" | "title" | "difficulty"
> & {
  typeKey: PuzzleType["key"];
  typeName: PuzzleType["name"];
  categoryKey: PuzzleCategory["key"];
  categoryName: PuzzleCategory["name"];
};

export type Recommendation = Candidate & { reason: string; score: number };

export type RecommendInput = {
  today: string;
  activity: TypeActivity[];
  stats: TypeStats[];
  byDifficulty: TypeDifficultyStats[];
  favouriteTypeKeys: string[];
  solvedPuzzleIds: string[];
  candidates: Candidate[];
  popularTypeKeys: string[];
};

type Signal = { points: number; reason: string | null };

const DAY_MS = 86_400_000;

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

const bySlug = (a: Candidate, b: Candidate) =>
  a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id);

/** The player's median solved difficulty in a type, each solve counted once. */
function medianSolvedDifficulty(rows: TypeDifficultyStats[]) {
  return median(rows.flatMap((row) => Array(row.solves).fill(row.difficulty)));
}

/**
 * How the player's time in a type compares with their other types at the difficulty they play it most:
 * their median over the median of the other types' medians there. Null without a comparison.
 */
function timeRatio(typeKey: string, byDifficulty: TypeDifficultyStats[]) {
  const own = byDifficulty
    .filter((row) => row.typeKey === typeKey)
    .toSorted((a, b) => b.solves - a.solves || a.difficulty - b.difficulty)[0];
  if (!own) return null;
  const others = median(
    byDifficulty
      .filter(
        (row) =>
          row.typeKey !== typeKey && row.difficulty === own.difficulty,
      )
      .map((row) => row.medianDurationMs),
  );
  return others ? own.medianDurationMs / others : null;
}

function mostPlayedCategory(activity: TypeActivity[]) {
  const started = new Map<string, number>();
  for (const row of activity) {
    started.set(
      row.categoryKey,
      (started.get(row.categoryKey) ?? 0) + row.started,
    );
  }
  return [...started].toSorted(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]?.[0];
}

/** Hints per solve across the player's other types in the category, weighted by solves. Null without one. */
function otherTypesAvgHints(typeKey: string, categoryKey: string, stats: TypeStats[]) {
  const rows = stats.filter(
    (row) => row.categoryKey === categoryKey && row.typeKey !== typeKey,
  );
  const solves = rows.reduce((sum, row) => sum + row.solves, 0);
  return solves === 0
    ? null
    : rows.reduce((sum, row) => sum + row.avgHints * row.solves, 0) / solves;
}

function typeSignals(
  candidate: Candidate,
  input: RecommendInput,
  favourites: Set<string>,
): Signal[] {
  const { today, activity, stats, byDifficulty } = input;
  const name = candidate.typeName;
  const signals: Signal[] = [];
  const add = (points: number, reason: string | null) =>
    points !== 0 && signals.push({ points, reason });

  const isFavourite = favourites.has(candidate.typeKey);
  const played = activity.find((row) => row.typeKey === candidate.typeKey);
  const typeStats = stats.find((row) => row.typeKey === candidate.typeKey);
  const typeDifficulty = byDifficulty.filter(
    (row) => row.typeKey === candidate.typeKey,
  );

  if (isFavourite) add(WEIGHTS.favourite, `Because you favourited ${name}`);

  if (!played) {
    const category = mostPlayedCategory(activity);
    if (category === candidate.categoryKey) {
      add(WEIGHTS.discovery, `Something new in ${candidate.categoryName}`);
    }
    if (candidate.difficulty === THRESHOLDS.untriedStepUpDifficulty) {
      add(WEIGHTS.stepUp, null);
    }
    return signals;
  }

  if (typeStats) {
    add(
      WEIGHTS.playedPerSolve *
        Math.min(typeStats.solves, WEIGHTS.playedMaxSolves),
      `You have solved ${typeStats.solves} ${name} ${typeStats.solves === 1 ? "puzzle" : "puzzles"}`,
    );
    const ratio = timeRatio(candidate.typeKey, byDifficulty);
    if (ratio !== null && ratio <= THRESHOLDS.fastRatio) {
      add(WEIGHTS.fast, `You are quick at ${name}`);
    }
    if (ratio !== null && ratio > THRESHOLDS.slowRatio) {
      add(-WEIGHTS.slow, null);
    }
    const othersAverage = otherTypesAvgHints(
      candidate.typeKey,
      candidate.categoryKey,
      stats,
    );
    if (
      othersAverage !== null &&
      typeStats.avgHints >= 1 &&
      typeStats.avgHints > othersAverage * THRESHOLDS.hintyRatio
    ) {
      add(-WEIGHTS.hinty, null);
    }
  }

  const solvedDifficulty = medianSolvedDifficulty(typeDifficulty);
  if (
    solvedDifficulty !== null &&
    candidate.difficulty === Math.round(solvedDifficulty) + 1
  ) {
    add(WEIGHTS.stepUp, `A step up from your ${name} puzzles`);
  }

  const sinceLast = daysBetween(played.lastDay, today);
  const sinceFirst = daysBetween(played.firstDay, today);
  if (sinceLast <= THRESHOLDS.recentDays) {
    add(WEIGHTS.recent, `You played ${name} recently`);
  }
  if (sinceFirst > 0) {
    add(
      WEIGHTS.comeback * Math.min((played.activeDays - 1) / sinceFirst, 1),
      `You keep coming back to ${name}`,
    );
  }
  add(
    WEIGHTS.returnAfterSolvePer *
      Math.min(played.returnsAfterSolve, WEIGHTS.returnAfterSolveMax),
    `You came back to ${name} after solving it`,
  );

  add(-WEIGHTS.unfinishedEach * played.unfinished, null);
  if (played.started > 0) {
    add(-WEIGHTS.abandonment * (played.unfinished / played.started), null);
  }
  if (played.staleUnfinished > 0) add(-WEIGHTS.staleUnfinished, null);
  if (
    played.started === 1 &&
    played.activeDays === 1 &&
    sinceLast > THRESHOLDS.onceLongAgoDays
  ) {
    add(-WEIGHTS.triedOnceLongAgo, null);
  }
  if (sinceLast > THRESHOLDS.dormantDays && !isFavourite) {
    add(-WEIGHTS.dormant, null);
  }
  return signals;
}

function popularStarts(
  popularTypeKeys: string[],
  candidates: Candidate[],
): Recommendation[] {
  const picks: Recommendation[] = [];
  for (const typeKey of popularTypeKeys) {
    const easiest = candidates
      .filter(
        (candidate) =>
          candidate.typeKey === typeKey &&
          candidate.difficulty <= THRESHOLDS.coldStartMaxDifficulty,
      )
      .toSorted((a, b) => a.difficulty - b.difficulty || bySlug(a, b))[0];
    if (easiest) {
      picks.push({ ...easiest, reason: "Popular start", score: 0 });
    }
    if (picks.length === THRESHOLDS.shelfSize) break;
  }
  return picks;
}

/**
 * The top unsolved puzzles by score, at most `perTypeCap` per type, ties broken by slug. A player with no
 * attempts and no favourites gets one easy puzzle from each of the `popularTypeKeys` instead (most played first).
 */
export function recommend(
  input: RecommendInput,
): { coldStart: boolean; picks: Recommendation[] } {
  const solved = new Set(input.solvedPuzzleIds);
  const candidates = input.candidates.filter(({ id }) => !solved.has(id));
  if (input.activity.length === 0 && input.favouriteTypeKeys.length === 0) {
    return {
      coldStart: true,
      picks: popularStarts(input.popularTypeKeys, candidates),
    };
  }

  const favourites = new Set(input.favouriteTypeKeys);
  const played = new Set(input.activity.map(({ typeKey }) => typeKey));
  const ranked = candidates
    .map((candidate): Recommendation => {
      const signals = typeSignals(candidate, input, favourites);
      const top = signals
        .filter(({ reason }) => reason !== null)
        .toSorted((a, b) => b.points - a.points)[0];
      const fallback = played.has(candidate.typeKey)
        ? `Another ${candidate.typeName} to try`
        : `Something new in ${candidate.categoryName}`;
      return {
        ...candidate,
        score: signals.reduce((sum, { points }) => sum + points, 0),
        reason: top?.reason ?? fallback,
      };
    })
    .toSorted((a, b) => b.score - a.score || bySlug(a, b));

  const perType = new Map<string, number>();
  const picks: Recommendation[] = [];
  for (const recommendation of ranked) {
    const taken = perType.get(recommendation.typeKey) ?? 0;
    if (taken >= THRESHOLDS.perTypeCap) continue;
    perType.set(recommendation.typeKey, taken + 1);
    picks.push(recommendation);
    if (picks.length === THRESHOLDS.shelfSize) break;
  }
  return { coldStart: false, picks };
}
