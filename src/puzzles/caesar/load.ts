import "server-only";
import { deriveCiphertext } from "./derive";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

/**
 * The ciphertext is derived from the plaintext and the shift, so both are read through
 * `loadSolution` and only the ciphertext leaves this function.
 */
export async function load(puzzleId: string) {
  const { plaintext, shift } = await loadSolution(puzzleId);
  return payloadSchema.parse({
    ciphertext: deriveCiphertext(plaintext, shift),
  });
}
