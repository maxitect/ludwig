import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
let signedIn = true;
vi.mock("@/lib/data/user", () => ({
  getCurrentUser: vi.fn(async () => {
    calls.push("getCurrentUser");
    return signedIn ? { id: "u" } : null;
  }),
  requireUser: vi.fn(async () => {
    calls.push("requireUser");
    return { id: "u" };
  }),
}));
vi.mock("@/lib/data/favourites", () => ({
  setFavouriteType: vi.fn(async () => {
    calls.push("write");
    return true;
  }),
  recordTypeVisit: vi.fn(async () => {
    calls.push("write");
  }),
}));

import { toggleFavouriteType, visitType } from "./favourites";

beforeEach(() => {
  calls.length = 0;
  signedIn = true;
});

describe("toggleFavouriteType", () => {
  it("rejects an unknown type without writing", async () => {
    expect(await toggleFavouriteType("not-a-type")).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(calls).toEqual(["requireUser"]);
  });

  it("authorises before it writes", async () => {
    expect(await toggleFavouriteType("troix")).toEqual({
      ok: true,
      favourite: true,
    });
    expect(calls).toEqual(["requireUser", "write"]);
  });
});

describe("visitType", () => {
  it("writes nothing when signed out", async () => {
    signedIn = false;
    await visitType("troix");
    expect(calls).toEqual(["getCurrentUser"]);
  });

  it("writes nothing for an unknown type", async () => {
    await visitType("not-a-type");
    expect(calls).toEqual(["getCurrentUser"]);
  });

  it("authenticates before it writes", async () => {
    await visitType("troix");
    expect(calls).toEqual(["getCurrentUser", "write"]);
  });
});
