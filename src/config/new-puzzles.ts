export const NEW_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A puzzle is new for `NEW_WINDOW_DAYS` days after it is published. */
export const isNewlyPublished = (publishedAt: Date | null, now = new Date()) =>
  publishedAt !== null &&
  publishedAt <= now &&
  now.getTime() - publishedAt.getTime() < NEW_WINDOW_DAYS * DAY_MS;
