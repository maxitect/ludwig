import "server-only";
import { derivePlaintext } from "./derive";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** No column holds the message: it is derived from the references and the text. */
export async function loadSolution(puzzleId: string) {
  const { lines, refs } = await load(puzzleId);
  return solutionSchema.parse({ plaintext: derivePlaintext(lines, refs) });
}
