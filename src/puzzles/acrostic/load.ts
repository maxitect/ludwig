import "server-only";
import { db } from "@/db";
import { RULE_LABELS } from "./derive";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.acrosticPuzzles.findFirst({
    where: { puzzleId },
    columns: { rule: true },
    with: {
      lines: { columns: { content: true }, orderBy: { position: "asc" } },
    },
  });
  if (!puzzle) throw new Error(`Acrostic puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    ruleLabel: RULE_LABELS[puzzle.rule],
    lines: puzzle.lines.map(({ content }) => content),
  });
}
