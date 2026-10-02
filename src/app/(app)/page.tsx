const tokens = [
  "paper",
  "paper-shade",
  "paper-deep",
  "ink",
  "ink-soft",
  "ludwig-red",
  "blood",
  "crayon",
  "shadow",
  "shadow-soft",
  "grid-blue",
  "book-blue",
];

const semantics = [
  "background",
  "foreground",
  "card",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "border",
  "ring",
];

const fonts = [
  { label: "Signature (Yesteryear)", className: "font-signature text-5xl", sample: "Ludwig." },
  { label: "Display light (Josefin Sans 300)", className: "font-display font-light text-3xl uppercase tracking-[0.04em]", sample: "The Gear Puzzle" },
  { label: "Display semibold (Josefin Sans 600)", className: "font-display font-semibold text-3xl uppercase tracking-[0.04em]", sample: "The Gear Puzzle" },
  { label: "Display bold (Josefin Sans 700)", className: "font-display font-bold text-3xl uppercase tracking-[0.04em]", sample: "The Gear Puzzle" },
  { label: "Sans (Jost)", className: "font-sans text-xl", sample: "Reverse chess starts from the end of the game." },
  { label: "Band (Barlow Semi Condensed 600)", className: "font-band font-semibold text-xl uppercase tracking-[0.08em]", sample: "Pocket Puzzle Collection" },
  { label: "Hand (Caveat Brush)", className: "font-hand text-4xl text-crayon", sample: "KNIGHT TO F3" },
  { label: "Mono (JetBrains Mono)", className: "font-mono text-lg break-all", sample: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR 00:42" },
];

export default function Home() {
  return (
    <main className="grid-paper mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 sm:px-8">
      <header className="raking flex flex-col gap-4 border-2 border-border p-6">
        <h1 className="font-display uppercase tracking-[0.04em]">
          <span className="block text-lg font-light">Design</span>
          <span className="block text-5xl font-bold">Token test sheet</span>
        </h1>
        <p className="max-w-prose text-lg">
          Textured paper, near-black ink, one red accent and blue-grey shadows.
          This page is a placeholder that exercises every colour token, font
          and texture until the home page replaces it.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          Colour tokens
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tokens.map((token) => (
            <li key={token} className="border-2 border-border bg-paper text-ink">
              <div
                className="h-16 border-b-2 border-border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <p className="p-2 font-mono text-sm">{token}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          Semantic variables
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {semantics.map((name) => (
            <li key={name} className="border-2 border-border bg-background">
              <div
                className="h-12 border-b-2 border-border"
                style={{ backgroundColor: `var(--${name})` }}
              />
              <p className="p-2 font-mono text-sm text-foreground">{name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          Typefaces
        </h2>
        <ul className="flex flex-col gap-6">
          {fonts.map(({ label, className, sample }) => (
            <li key={label} className="flex flex-col gap-1 border-b-2 border-border pb-4">
              <p className="font-mono text-sm text-muted-foreground">{label}</p>
              <p className={className}>
                {sample}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
