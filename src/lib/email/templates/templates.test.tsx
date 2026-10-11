import { render } from "react-email";
import { describe, expect, it } from "vitest";
import { existingSignUp } from "./existing-sign-up";
import { resetPassword } from "./reset-password";
import { verifyEmail } from "./verify-email";

const url = "http://localhost:3000/api/auth/verify-email?token=abc";

describe("email templates", () => {
  it.each([
    ["verify", verifyEmail({ name: "Ann", url }), true],
    ["reset", resetPassword({ name: "Ann", url }), true],
    ["existing sign-up", existingSignUp({ name: "Ann" }), false],
  ])("renders %s with brand, sign-off and disclaimer", async (_, t, hasLink) => {
    const html = await render(t.react);
    const text = await render(t.react, { plainText: true });
    for (const out of [html, text]) {
      expect(out).toContain("Ann");
      expect(out).toContain("Ludwig");
      expect(out).toContain("not affiliated with the BBC");
    }
    if (hasLink) {
      expect(html).toContain(`href="${url}"`);
      expect(text).toContain(url);
    }
  });
});
