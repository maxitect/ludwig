const PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

/** The centre box's missing digits, by cell index: r4c4, r4c6, r5c5, r6c4, r6c6. */
const CENTRE_BOX = new Map([
  [30, "7"],
  [32, "1"],
  [40, "5"],
  [48, "9"],
  [50, "4"],
]);

export function MirroredSudoku({
  className = "",
  writeIn = false,
}: {
  className?: string;
  writeIn?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`grid aspect-square grid-cols-9 border-2 border-border ${className}`}
    >
      {Array.from(PUZZLE, (digit, index) => {
        const written = writeIn ? CENTRE_BOX.get(index) : undefined;
        return (
          <span
            key={index}
            className="flex items-center justify-center border border-border font-display font-bold"
          >
            {digit !== "0" && <span className="scale-x-[-1]">{digit}</span>}
            {written && (
              <span
                className={`seq-mirror-digit seq-mirror-r${Math.floor(index / 9) + 1} scale-x-[-1] font-hand font-normal text-primary`}
              >
                {written}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
