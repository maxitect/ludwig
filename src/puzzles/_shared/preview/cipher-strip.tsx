const LINE_LENGTH = 14;
const MAX_LINES = 4;
const LINE_HEIGHT = 12;

/** The first lines of a cipher text, in a typewriter face. */
export function CipherStrip({ text }: { text: string }) {
  const lines = text.split(" ").reduce<string[]>((acc, word) => {
    const last = acc.at(-1);
    if (last !== undefined && last.length + word.length < LINE_LENGTH) {
      acc[acc.length - 1] = `${last} ${word}`;
    } else {
      acc.push(word);
    }
    return acc;
  }, []);
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown[MAX_LINES - 1] += "...";
  return (
    <svg
      viewBox={`0 0 100 ${MAX_LINES * LINE_HEIGHT + 4}`}
      className="size-full"
      aria-hidden="true"
    >
      {shown.map((line, i) => (
        <text
          key={i}
          x={50}
          y={LINE_HEIGHT * (i + 1)}
          textAnchor="middle"
          fontSize={9}
          className="fill-ink font-mono font-bold uppercase"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
