"use server";

import { z } from "zod";
import {
  clearAttemptState,
  completeAttempt,
  getOrCreateAttempt,
  recordHint,
  replaceAttemptState,
} from "@/lib/data/attempts";
import {
  checkPuzzleAnswer,
  checkPuzzleCell,
  getPublishedTypeKey,
  revealPuzzleCell,
} from "@/lib/data/puzzles";
import { getCurrentUser, requireUser } from "@/lib/data/user";
import { getPuzzleModule } from "@/puzzles/registry";
import type { RungProblem } from "@/puzzles/word-ladder/schema";

type CheckResult = {
  correct: boolean;
  epilogue?: string;
  rungProblems?: RungProblem[];
};
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
  z.object({
    mode: z.literal("cell"),
    ...cellSchema.shape,
    value: z.string().min(1).max(8),
  }),
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

export async function clearState(
  puzzleId: string,
): Promise<{ ok: true } | ActionError> {
  const user = await requireUser();
  if (!puzzleIdSchema.safeParse(puzzleId).success) return invalid;
  await clearAttemptState(user.id, puzzleId);
  return { ok: true };
}

/**
 * Full mode checks `answer` as a whole and completes the attempt when correct.
 * Signed out, full mode only checks: no attempt or hint rows are written.
 * Cell mode ignores `answer`: the cell's own `value` is checked and one hint recorded.
 */
export async function checkAnswer(
  puzzleId: string,
  answer: unknown,
  options: z.input<typeof checkOptionsSchema>,
): Promise<{ ok: true; result: CheckResult } | ActionError> {
  const user = await getCurrentUser();
  const parsedOptions = checkOptionsSchema.safeParse(options);
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsedOptions.success) {
    return invalid;
  }
  const typeKey = await getPublishedTypeKey(puzzleId);
  if (!typeKey) return notFound;
  const { data } = parsedOptions;

  if (data.mode === "cell") {
    if (!user) throw new Error("Unauthorised");
    const result = await checkPuzzleCell(
      typeKey,
      puzzleId,
      data.row,
      data.col,
      data.value,
    );
    if (!result) return invalid;
    const attempt = await getOrCreateAttempt(user.id, puzzleId);
    await recordHint(attempt.id, "check_cell", data.row, data.col);
    return { ok: true, result };
  }

  const parsedAnswer =
    getPuzzleModule(typeKey).schema.answerSchema.safeParse(answer);
  if (!parsedAnswer.success) return invalid;
  const result = await checkPuzzleAnswer(typeKey, puzzleId, parsedAnswer.data);
  if (!user) return { ok: true, result };
  const attempt = await getOrCreateAttempt(user.id, puzzleId);
  if (result.correct) await completeAttempt(attempt.id, data.durationMs);
  return { ok: true, result };
}

/** Returns only the one cell's value; the grid never reaches the client. */
export async function revealCell(
  puzzleId: string,
  row: number,
  col: number,
): Promise<{ ok: true; value: string } | ActionError> {
  const user = await requireUser();
  const parsed = cellSchema.safeParse({ row, col });
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsed.success) {
    return invalid;
  }
  const typeKey = await getPublishedTypeKey(puzzleId);
  if (!typeKey) return notFound;
  const value = await revealPuzzleCell(
    typeKey,
    puzzleId,
    parsed.data.row,
    parsed.data.col,
  );
  if (value === null) return invalid;
  const attempt = await getOrCreateAttempt(user.id, puzzleId);
  await recordHint(attempt.id, "reveal_cell", parsed.data.row, parsed.data.col);
  return { ok: true, value };
}
