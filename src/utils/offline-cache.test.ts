import { describe, expect, it } from "vitest";
import {
  guestMarker,
  isCacheablePublicPath,
  isGuestResponseBody,
} from "./offline-cache";

describe("isCacheablePublicPath", () => {
  it.each([
    "/",
    "/puzzles",
    "/puzzles/",
    "/puzzles/crossword",
    "/reverse-chess",
    "/gears",
    "/this-week",
  ])("caches %s", (path) => {
    expect(isCacheablePublicPath(path)).toBe(true);
  });

  it.each([
    "/casebook",
    "/casebook/anything",
    "/settings",
    "/settings/profile",
    "/api/auth/get-session",
    "/puzzles/crossword/some-slug",
    "/sign-in",
    "/offline",
    "/serwist/sw.js",
    "/gears/extra",
  ])("never caches %s", (path) => {
    expect(isCacheablePublicPath(path)).toBe(false);
  });
});

describe("isGuestResponseBody", () => {
  it("accepts a body carrying the guest marker", () => {
    expect(isGuestResponseBody(`<div ${guestMarker}="">Sign in</div>`)).toBe(
      true,
    );
  });

  it("rejects a body without it", () => {
    expect(isGuestResponseBody("<div>Account</div>")).toBe(false);
  });
});
