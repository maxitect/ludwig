import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { Credit } from "@/components/brand";
import { SolvedBadge, type SolvedIds } from "@/components/puzzle/solved-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSolvedPuzzleIds } from "@/lib/data/attempts";
import { getReverseChessHub } from "@/lib/data/reverse-chess";
import { PieceGlyph, type PieceKind } from "@/puzzles/_shared/chess-board";
import "./hub.css";

export const metadata: Metadata = {
  title: "Reverse Chess | Ludwig.",
  description:
    "Instead of having to work out what comes next, you deduce what came before.",
};

type Hub = Awaited<ReturnType<typeof getReverseChessHub>>;

const SECTIONS = [
  {
    key: "lastMove",
    id: "last-move",
    top: "Mode A",
    title: "The Last Move",
    blurb: "One move back. What was just played?",
  },
  {
    key: "unwind",
    id: "unwind",
    top: "Mode B",
    title: "Unwind",
    blurb: "Take back several moves to reach an earlier position.",
  },
  {
    key: "proofGame",
    id: "proof-game",
    top: "Mode B",
    title: "Proof Game",
    blurb: "Take back every move, all the way to the starting position.",
  },
] as const satisfies readonly {
  key: keyof Hub;
  id: string;
  top: string;
  title: string;
  blurb: string;
}[];

const DECORATIVE_PIECES = [
  { piece: "king", className: "top-4 right-4 w-16 sm:top-2 sm:right-8 sm:w-44" },
  { piece: "knight", className: "hidden sm:block sm:top-32 sm:right-40 sm:w-28" },
] as const satisfies readonly { piece: PieceKind; className: string }[];

const HOW_IT_WORKS = [
  "You are shown a chess position, never the game that led to it.",
  "Drag a piece backwards to the square it came from.",
  "If it captured something, say what, and put it back.",
  "Only one answer keeps the whole story legal.",
];

const UNWIND_HOW_IT_WORKS = [
  "Unwind gives you a goal, such as \u201cBefore the black pawn left a7\u201d.",
  "Take back several moves in a row, one at a time, and the last position you reach must meet the goal.",
  "Wrong steps are allowed until you press Check, which flags the first one that could not have happened.",
  "Only one chain of take-backs gets there.",
];

const PROOF_GAME_HOW_IT_WORKS = [
  "You are shown a position reached by a real game from the starting position, and told how many half-moves it took.",
  "Take every move back, one at a time, until the board is the starting position again.",
  "Castling rights and the en passant square must come out right as well, not only the pieces.",
  "Only one game gets there. Move order matters.",
];

export default async function ReverseChessPage() {
  const hub = await getReverseChessHub();
  const solved = getSolvedPuzzleIds(
    SECTIONS.flatMap(({ key }) => hub[key].map(({ id }) => id)),
  );

  return (
    <main className="relative mx-auto flex max-w-5xl flex-col gap-10 overflow-x-clip px-4 py-12 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {DECORATIVE_PIECES.map(({ piece, className }) => (
          <div key={piece} className={`hub-piece absolute ${className}`}>
            <PieceGlyph colour="white" piece={piece} />
          </div>
        ))}
      </div>
      <header className="relative">
        <Credit level={1} top="Reverse" bottom="Chess" />
      </header>
      <Card className="relative max-w-2xl">
        <CardContent>
          <blockquote className="flex flex-col gap-2">
            <p className="font-display text-2xl font-bold tracking-[0.04em] uppercase">
              &ldquo;Instead of having to work out what comes next, you deduce
              what came before.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">John, Ludwig</footer>
          </blockquote>
        </CardContent>
      </Card>
      <section
        aria-labelledby="how-it-works"
        className="relative flex max-w-2xl flex-col gap-4"
      >
        <h2
          id="how-it-works"
          className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase"
        >
          How it works
        </h2>
        <h3 className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          The Last Move
        </h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          Unwind
        </h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {UNWIND_HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          Proof Game
        </h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {PROOF_GAME_HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <ModeSections hub={hub} solved={solved} />
      <section aria-labelledby="rota" className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-1 border-b-2 border-border pb-1">
          <Credit
            id="rota"
            level={2}
            top="Mode C"
            bottom="The Rota"
            className="[&>span:last-child]:text-3xl"
          />
          <p className="text-sm text-muted-foreground">
            Unpick a swapped duty roster, one unswap at a time, from the clues
            that remain.
          </p>
        </div>
        <Link
          href="/puzzles/rota"
          className="flex items-center justify-between gap-4 border-2 border-border p-4 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
            Play The Rota
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

function ModeSections({ hub, solved }: { hub: Hub; solved: SolvedIds }) {
  return SECTIONS.map(({ key, id, top, title, blurb }) => (
    <section
      key={key}
      aria-labelledby={id}
      className="relative flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1 border-b-2 border-border pb-1">
        <Credit
          id={id}
          level={2}
          top={top}
          bottom={title}
          className="[&>span:last-child]:text-3xl"
        />
        <p className="text-sm text-muted-foreground">{blurb}</p>
      </div>
      {hub[key].length === 0 ? (
        <p>No puzzles in this mode have been published yet.</p>
      ) : (
        <ul className="flex flex-col">
          {hub[key].map((puzzle) => (
            <li key={puzzle.id} className="border-b-2 border-border">
              <Link
                href={`/puzzles/reverse-chess/${puzzle.slug}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
                  {puzzle.title}
                </span>
                <span className="flex items-center gap-3">
                  <Suspense fallback={null}>
                    <SolvedBadge puzzleId={puzzle.id} solved={solved} />
                  </Suspense>
                  <Badge variant="difficulty" level={puzzle.difficulty} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  ));
}
