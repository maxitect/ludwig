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
  it("accepts a body carrying the rendered guest menu", () => {
    expect(isGuestResponseBody(`${guestMarker} class="flex">Sign in</div>`)).toBe(
      true,
    );
  });

  it("rejects a body without it", () => {
    expect(isGuestResponseBody("<div>Account</div>")).toBe(false);
  });

  it.each([
    "<span>data-guest-menu</span>",
    "<span>&lt;div data-guest-menu=&quot;&quot;&gt;</span>",
    String.raw`"name":"\u003cdiv data-guest-menu=\"\"\u003e"`,
  ])("rejects a display name that imitates it: %s", (body) => {
    expect(isGuestResponseBody(body)).toBe(false);
  });
});
