const publicPagePatterns = [
  /^\/$/,
  /^\/puzzles$/,
  /^\/puzzles\/[^/]+$/,
  /^\/reverse-chess$/,
  /^\/gears$/,
  /^\/this-week$/,
];

/** Marker rendered only by the signed-out account slot. A response is cached only if it contains it, so anything that read a session is never stored. */
export const guestMarker = "data-guest-menu";

export function isCacheablePublicPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return publicPagePatterns.some((pattern) => pattern.test(path));
}

export function isGuestResponseBody(body: string): boolean {
  return body.includes(guestMarker);
}
