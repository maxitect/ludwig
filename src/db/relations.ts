import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
    settings: r.one.userSettings({
      from: r.user.id,
      to: r.userSettings.userId,
    }),
    attempts: r.many.attempts({ from: r.user.id, to: r.attempts.userId }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  userSettings: {
    user: r.one.user({
      from: r.userSettings.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  puzzleCategories: {
    types: r.many.puzzleTypes({
      from: r.puzzleCategories.key,
      to: r.puzzleTypes.categoryKey,
    }),
  },
  puzzleTypes: {
    category: r.one.puzzleCategories({
      from: r.puzzleTypes.categoryKey,
      to: r.puzzleCategories.key,
      optional: false,
    }),
    puzzles: r.many.puzzles({
      from: r.puzzleTypes.key,
      to: r.puzzles.typeKey,
    }),
  },
  volumes: {
    puzzles: r.many.puzzles({ from: r.volumes.id, to: r.puzzles.volumeId }),
  },
  puzzles: {
    type: r.one.puzzleTypes({
      from: r.puzzles.typeKey,
      to: r.puzzleTypes.key,
      optional: false,
    }),
    volume: r.one.volumes({ from: r.puzzles.volumeId, to: r.volumes.id }),
    weekly: r.many.weeklyPuzzles({
      from: r.puzzles.id,
      to: r.weeklyPuzzles.puzzleId,
    }),
    attempts: r.many.attempts({ from: r.puzzles.id, to: r.attempts.puzzleId }),
  },
  weeklyPuzzles: {
    puzzle: r.one.puzzles({
      from: r.weeklyPuzzles.puzzleId,
      to: r.puzzles.id,
      optional: false,
    }),
  },
  attempts: {
    user: r.one.user({
      from: r.attempts.userId,
      to: r.user.id,
      optional: false,
    }),
    puzzle: r.one.puzzles({
      from: [r.attempts.puzzleId, r.attempts.typeKey],
      to: [r.puzzles.id, r.puzzles.typeKey],
      optional: false,
    }),
    hints: r.many.attemptHints({
      from: r.attempts.id,
      to: r.attemptHints.attemptId,
    }),
  },
  attemptHints: {
    attempt: r.one.attempts({
      from: r.attemptHints.attemptId,
      to: r.attempts.id,
      optional: false,
    }),
  },
}));
