"use server";

import { requireUser, setUserChessNotation } from "@/lib/data/user";
import { chessNotationSchema } from "@/lib/forms/chess-notation";

export async function saveChessNotation(input: unknown) {
  const user = await requireUser();
  const { chessNotation } = chessNotationSchema.parse(input);
  await setUserChessNotation(user.id, chessNotation);
}
