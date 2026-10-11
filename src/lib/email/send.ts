import "server-only";
import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";
import { env } from "@/env";

type Email = { to: string; subject: string; react: ReactElement };

const UNDELIVERABLE = /\.(test|local)$/i;

/** Renders the template to HTML and plain text, then sends it through Resend. Outside production a missing key logs the email to the server console instead, as do test addresses on reserved domains, which would only bounce. */
export async function sendEmail({ to, subject, react }: Email) {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);
  if (!env.RESEND_API_KEY && env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!env.RESEND_API_KEY || UNDELIVERABLE.test(to)) {
    console.log(`[email] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
