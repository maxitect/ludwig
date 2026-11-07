import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/data/user", () => ({
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
  recordTypeVisit: vi.fn(),
}));

import { toggleFavouriteType } from "./favourites";

beforeEach(() => {
  calls.length = 0;
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
