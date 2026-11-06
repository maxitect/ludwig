const publicPagePatterns = [
  /^\/$/,
  /^\/puzzles$/,
  /^\/puzzles\/[^/]+$/,
  /^\/reverse-chess$/,
  /^\/gears$/,
  /^\/this-week$/,
];

/** The opening tag only the signed-out account slot renders. A page is cached only if it contains it, so anything that read a session is never stored. The angle bracket makes it unforgeable: React escapes it in any user-supplied text, such as a display name. */
export const guestMarker = '<div data-guest-menu=""';

export function isCacheablePublicPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return publicPagePatterns.some((pattern) => pattern.test(path));
}

export function isGuestResponseBody(body: string): boolean {
  return body.includes(guestMarker);
}
