"use server";

import { z } from "zod";
import { getCompletion } from "@/lib/data/attempts";
import { getCurrentUser } from "@/lib/data/user";
import { submitWord } from "@/lib/data/word-wheel";

const puzzleIdSchema = z.uuid();
const wordSchema = z.string().regex(/^[a-z]{1,9}$/);

/**
 * Judges a word against the wheel and the dictionary on the server and stores it for a signed-in
 * player. Open to signed-out players, who only get the verdict; the dictionary never leaves the server.
 */
export async function submitWheelWord(puzzleId: string, word: string) {
  const parsedWord = wordSchema.safeParse(word);
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsedWord.success) {
    return { ok: false as const, error: "invalid" as const };
  }
  const user = await getCurrentUser();
  if (user && (await getCompletion(user.id, puzzleId))) {
    return { ok: false as const, error: "invalid" as const };
  }
  const verdict = await submitWord(user?.id ?? null, puzzleId, parsedWord.data);
  return verdict
    ? { ok: true as const, ...verdict }
    : { ok: false as const, error: "not_found" as const };
}
