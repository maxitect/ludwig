import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

export const unsubscribeKinds = ["favourites", "streak"] as const;
export type UnsubscribeKind = (typeof unsubscribeKinds)[number];

const sign = (payload: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`unsubscribe:${payload}`)
    .digest("base64url");

/** A link token that proves the email was sent for this user and kind, so no session or bare user id is needed. */
export function createUnsubscribeToken(userId: string, kind: UnsubscribeKind) {
  const payload = Buffer.from(`${userId}.${kind}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readUnsubscribeToken(token: string) {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  const [userId, kind] = Buffer.from(payload, "base64url")
    .toString()
    .split(".");
  const known = unsubscribeKinds.find((candidate) => candidate === kind);
  return userId && known ? { userId, kind: known } : null;
}

export function unsubscribeUrl(
  baseUrl: string,
  userId: string,
  kind: UnsubscribeKind,
) {
  return `${baseUrl}/api/unsubscribe?token=${createUnsubscribeToken(userId, kind)}`;
}
