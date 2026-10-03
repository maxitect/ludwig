import type { WeeklySchedule } from "../scripts/seed-weekly";

export const weekly = [
  {
    weekStart: "2026-09-28",
    first: { type: "anagram", slug: "title-sequence" },
    second: { type: "crossword", slug: "fresh-ink" },
  },
  {
    weekStart: "2026-10-05",
    first: { type: "spot-difference", slug: "team-building" },
    second: { type: "crossword", slug: "paper-round" },
  },
  {
    weekStart: "2026-10-12",
    first: { type: "anagram", slug: "crossing-point" },
    second: { type: "spot-difference", slug: "away-day" },
  },
  {
    weekStart: "2026-10-19",
    first: { type: "crossword", slug: "pencil-case" },
    second: { type: "spot-difference", slug: "group-portrait" },
  },
  {
    weekStart: "2026-10-26",
    first: { type: "spot-difference", slug: "hats-and-ties" },
    second: { type: "anagram", slug: "looking-back" },
  },
  {
    weekStart: "2026-11-02",
    first: { type: "crossword", slug: "second-draft" },
    second: { type: "spot-difference", slug: "stately-home" },
  },
  {
    weekStart: "2026-11-09",
    first: { type: "anagram", slug: "night-light" },
    second: { type: "crossword", slug: "margin-notes" },
  },
  {
    weekStart: "2026-11-16",
    first: { type: "spot-difference", slug: "team-building" },
    second: { type: "anagram", slug: "holy-ground" },
  },
  {
    weekStart: "2026-11-23",
    first: { type: "crossword", slug: "fresh-ink" },
    second: { type: "spot-difference", slug: "away-day" },
  },
  {
    weekStart: "2026-11-30",
    first: { type: "anagram", slug: "title-sequence" },
    second: { type: "crossword", slug: "paper-round" },
  },
  {
    weekStart: "2026-12-07",
    first: { type: "spot-difference", slug: "group-portrait" },
    second: { type: "crossword", slug: "pencil-case" },
  },
  {
    weekStart: "2026-12-14",
    first: { type: "anagram", slug: "crossing-point" },
    second: { type: "spot-difference", slug: "hats-and-ties" },
  },
  {
    weekStart: "2026-12-21",
    first: { type: "crossword", slug: "second-draft" },
    second: { type: "anagram", slug: "looking-back" },
  },
  {
    weekStart: "2026-12-28",
    first: { type: "spot-difference", slug: "stately-home" },
    second: { type: "crossword", slug: "margin-notes" },
  },
] satisfies WeeklySchedule;
