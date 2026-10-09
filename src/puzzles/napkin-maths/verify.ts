import type { Content } from "./schema";

/**
 * Structure only: the worked derivation in the file's meta is for human review and is never
 * evaluated, so it must be present. The schema already requires an answer.
 */
export function verifyNapkinMaths(
  { lines, answer }: Content,
  { workings }: { workings?: string },
) {
  if (lines.length < 2) {
    throw new Error(`needs at least 2 lines, has ${lines.length}`);
  }
  if (lines.some((line) => !line.trim())) throw new Error("a line is blank");
  if (!answer.trim()) throw new Error("the answer is missing");
  if (!workings?.trim()) {
    throw new Error("meta.workings must hold the worked derivation");
  }
}
