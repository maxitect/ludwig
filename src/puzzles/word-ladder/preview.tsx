import { TileBlock } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const MAX_EMPTY_RUNGS = 2;

export function Preview({
  payload: { startWord, endWord, rungCount },
}: {
  payload: Payload;
}) {
  const width = Math.max(startWord.length, endWord.length);
  const row = (word: string) =>
    Array.from({ length: width }, (_, i) => word[i] ?? " ");
  const empty = Math.max(0, Math.min(rungCount - 2, MAX_EMPTY_RUNGS));
  return (
    <TileBlock
      perRow={width}
      tiles={[
        ...row(startWord),
        ...Array.from({ length: empty * width }, () => " "),
        ...row(endWord),
      ]}
    />
  );
}
