"use server";

import { z } from "zod";
import {
  completeAttempt,
  getOrCreateAttempt,
  recordHint,
  replaceAttemptState,
} from "@/lib/data/attempts";
import { checkPuzzleAnswer, getPublishedTypeKey } from "@/lib/data/puzzles";
import { requireUser } from "@/lib/data/user";
import { getPuzzleModule } from "@/puzzles/registry";

type ActionError = { ok: false; error: "invalid" | "not_found" };
const invalid: ActionError = { ok: false, error: "invalid" };
const notFound: ActionError = { ok: false, error: "not_found" };

const puzzleIdSchema = z.uuid();
const cellSchema = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
});
const checkOptionsSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("full"),
    durationMs: z.number().int().nonnegative(),
  }),
  z.object({ mode: z.literal("cell"), ...cellSchema.shape }),
]);

export async function saveState(
  puzzleId: string,
  state: unknown,
): Promise<{ ok: true } | ActionError> {
  const user = await requireUser();
  if (!puzzleIdSchema.safeParse(puzzleId).success) return invalid;
  const typeKey = await getPublishedTypeKey(puzzleId);
  if (!typeKey) return notFound;
  const parsed = getPuzzleModule(typeKey).schema.attemptSchema.safeParse(state);
  if (!parsed.success) return invalid;
  const attempt = await getOrCreateAttempt(user.id, puzzleId);
  await replaceAttemptState(attempt.id, parsed.data);
  return { ok: true };
}

export async function checkAnswer(
  puzzleId: string,
  answer: unknown,
  options: z.input<typeof checkOptionsSchema>,
): Promise<
  | { ok: true; result: Awaited<ReturnType<typeof checkPuzzleAnswer>> }
  | ActionError
> {
  const user = await requireUser();
  const parsedOptions = checkOptionsSchema.safeParse(options);
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsedOptions.success) {
    return invalid;
  }
  const typeKey = await getPublishedTypeKey(puzzleId);
  if (!typeKey) return notFound;
  const parsedAnswer =
    getPuzzleModule(typeKey).schema.answerSchema.safeParse(answer);
  if (!parsedAnswer.success) return invalid;

  const attempt = await getOrCreateAttempt(user.id, puzzleId);
  const result = await checkPuzzleAnswer(typeKey, puzzleId, parsedAnswer.data);
  const { data } = parsedOptions;
  if (data.mode === "cell") {
    await recordHint(attempt.id, "check_cell", data.row, data.col);
  } else if (result.correct) {
    await completeAttempt(attempt.id, data.durationMs);
  }
  return { ok: true, result };
}

export async function revealCell(
  puzzleId: string,
  row: number,
  col: number,
): Promise<{ ok: true } | ActionError> {
  const user = await requireUser();
  const parsed = cellSchema.safeParse({ row, col });
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsed.success) {
    return invalid;
  }
  if (!(await getPublishedTypeKey(puzzleId))) return notFound;
  const attempt = await getOrCreateAttempt(user.id, puzzleId);
  await recordHint(attempt.id, "reveal_cell", parsed.data.row, parsed.data.col);
  return { ok: true };
}
