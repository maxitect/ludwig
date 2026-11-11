import { render } from "react-email";
import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, readUnsubscribeToken } from "../unsubscribe";
import { favouriteDigest } from "./favourite-digest";
import { streakNudge } from "./streak-nudge";

const unsubscribeUrl = "http://localhost:3000/api/unsubscribe?token=abc";
const puzzleUrl = "http://localhost:3000/puzzles/troix/one";

describe("notification templates", () => {
  it("renders the digest with puzzles, a milestone, sign-off, disclaimer and unsubscribe link", async () => {
    const t = favouriteDigest({
      name: "Ann",
      puzzles: [{ title: "Cold Case", typeName: "Troix", url: puzzleUrl }],
      milestoneDays: 30,
      url: "http://localhost:3000/puzzles",
      unsubscribeUrl,
    });
    expect(t.subject).toBe("A new puzzle in a type you follow");
    const html = await render(t.react);
    const text = await render(t.react, { plainText: true });
    expect(html).toContain(`href="${puzzleUrl}"`);
    expect(html).toContain(`href="${unsubscribeUrl}"`);
    for (const out of [html, text]) {
      expect(out).toContain("Ann");
      expect(out).toContain("Cold Case");
      expect(out).toContain("30 days");
      expect(out).toContain("Ludwig");
      expect(out).toContain("not affiliated with the BBC");
    }
    expect(text).toContain(unsubscribeUrl);
  });

  it("renders a milestone-only digest", async () => {
    const t = favouriteDigest({
      name: "Ann",
      puzzles: [],
      milestoneDays: 7,
      url: "http://localhost:3000/puzzles",
      unsubscribeUrl,
    });
    expect(t.subject).toBe("7 days in a row on Ludwig.");
    expect(await render(t.react, { plainText: true })).not.toContain("New in");
  });

  it("renders the streak nudge with the length and links", async () => {
    const t = streakNudge({ name: "Ann", streak: 12, url: puzzleUrl, unsubscribeUrl });
    expect(t.subject).toBe("Your 12-day streak ends at midnight");
    const html = await render(t.react);
    const text = await render(t.react, { plainText: true });
    expect(html).toContain(`href="${puzzleUrl}"`);
    for (const out of [html, text]) {
      expect(out).toContain("12 days");
      expect(out).toContain("midnight");
      expect(out).toContain("not affiliated with the BBC");
    }
    expect(text).toContain(unsubscribeUrl);
  });
});

describe("unsubscribe token", () => {
  const id = "0b9d8f0e-6f1f-4a52-9d57-1a3a0c2f6d11";

  it("round-trips the user and kind", () => {
    expect(readUnsubscribeToken(createUnsubscribeToken(id, "streak"))).toEqual({
      userId: id,
      kind: "streak",
    });
  });

  it("rejects a bare user id, a tampered kind and a tampered signature", () => {
    const token = createUnsubscribeToken(id, "streak");
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(`${id}.favourites`).toString("base64url");
    expect(readUnsubscribeToken(id)).toBeNull();
    expect(readUnsubscribeToken(`${forged}.${signature}`)).toBeNull();
    expect(readUnsubscribeToken(`${payload}.${signature}x`)).toBeNull();
    expect(readUnsubscribeToken("")).toBeNull();
  });
});
