/** Puzzles written by generator scripts rather than content files; `db:seed` never removes them. */
export const GENERATED_SLUG_PREFIX = "daily-";

export const dailySlug = (date: string) => `${GENERATED_SLUG_PREFIX}${date}`;
