import { readFileSync } from "node:fs";
import path from "node:path";

/** The dictionary lines of `content/words.txt`, in file order. For scripts only: never import this from client code. */
export function readDictionaryFile(
  file = path.join(process.cwd(), "content", "words.txt"),
) {
  return readFileSync(file, "utf8").split("\n").filter(Boolean);
}
