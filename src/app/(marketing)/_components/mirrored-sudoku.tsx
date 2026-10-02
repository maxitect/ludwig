const PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

export function MirroredSudoku({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`grid aspect-square grid-cols-9 border-2 border-border ${className}`}
    >
      {Array.from(PUZZLE, (digit, index) => (
        <span
          key={index}
          className="flex items-center justify-center border border-border font-display font-bold"
        >
          {digit !== "0" && <span className="scale-x-[-1]">{digit}</span>}
        </span>
      ))}
    </div>
  );
}
