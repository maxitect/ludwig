import type { WeeklySchedule } from "../scripts/seed-weekly";

export const weekly = [
  {
    weekStart: "2026-09-28",
    first: { type: "anagram", slug: "title-sequence" },
    second: { type: "crossword", slug: "fresh-ink" },
  },
  {
    weekStart: "2026-10-05",
    first: { type: "crossword", slug: "paper-round" },
    second: { type: "anagram", slug: "night-light" },
  },
  {
    weekStart: "2026-10-12",
    first: { type: "anagram", slug: "crossing-point" },
    second: { type: "crossword", slug: "margin-notes" },
  },
  {
    weekStart: "2026-10-19",
    first: { type: "crossword", slug: "pencil-case" },
    second: { type: "anagram", slug: "holy-ground" },
  },
  {
    weekStart: "2026-10-26",
    first: { type: "anagram", slug: "looking-back" },
    second: { type: "crossword", slug: "second-draft" },
  },
  {
    weekStart: "2026-11-02",
    first: { type: "crossword", slug: "fresh-ink" },
    second: { type: "anagram", slug: "crossing-point" },
  },
  {
    weekStart: "2026-11-09",
    first: { type: "anagram", slug: "night-light" },
    second: { type: "crossword", slug: "pencil-case" },
  },
  {
    weekStart: "2026-11-16",
    first: { type: "crossword", slug: "margin-notes" },
    second: { type: "anagram", slug: "title-sequence" },
  },
] satisfies WeeklySchedule;
