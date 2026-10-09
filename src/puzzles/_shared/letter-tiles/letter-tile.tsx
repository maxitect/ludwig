import { cn } from "@/utils/cn";

const TILT_DEGREES = [-2, 1, 0, 2, -1];

export const tileClass =
  "paper-sheet flex size-12 items-center justify-center font-hand text-3xl text-crayon uppercase focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-14";

/** A small, index-seeded tilt, so server and client render the same rotation. */
export const tilt = (index: number) => ({
  transform: `rotate(${TILT_DEGREES[(index * 3 + 1) % TILT_DEGREES.length]}deg)`,
});

/** A row of given letters, as tiles that can't be edited. */
export function LetterTiles({
  word,
  label,
  offset = 0,
}: {
  word: string;
  label: string;
  offset?: number;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {[...word].map((letter, i) => (
        <span
          key={i}
          style={tilt(offset + i)}
          className={cn(tileClass, "bg-paper-shade text-ink")}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
