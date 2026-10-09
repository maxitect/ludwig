import Link from "next/link";
import { Credit, Raking, Walker, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { PieceGlyph } from "@/puzzles/_shared/chess-board/pieces";
import type { PieceKind } from "@/puzzles/_shared/chess-board/squares";
import { MirroredSudoku } from "./mirrored-sudoku";
import { ScrollFallback } from "./scroll-fallback";
import "./title-sequence.css";

const ROOMS = [
  { name: "The Grid", to: "Word puzzles", href: "/puzzles#word" },
  { name: "The Board", to: "Reverse Chess", href: "/reverse-chess" },
  { name: "The Mirror", to: "Logic puzzles", href: "/puzzles#logic" },
] as const;

function ToppledPiece({
  className,
  piece,
}: {
  className: string;
  piece: PieceKind;
}) {
  return (
    <div aria-hidden="true" className={`seq-piece ${className}`}>
      <div className="seq-cast" />
      <div className="seq-piece-body">
        <div className="seq-piece-paper size-full">
          <PieceGlyph colour="white" piece={piece} />
        </div>
        <div className="seq-piece-ink size-full">
          <PieceGlyph colour="black" piece={piece} />
        </div>
      </div>
    </div>
  );
}

export function TitleSequence() {
  return (
    <main className="title-sequence">
      <ScrollFallback />
      <div className="seq-track">
        <div className="seq-stage">
          <div aria-hidden="true" className="seq-scene">
            <div className="seq-world">
              <div className="seq-plane seq-floor" />
              <div className="seq-plane seq-wall-left" />
              <div className="seq-plane seq-wall-right" />
              <div className="seq-plane seq-wall seq-wall-grid" />
              <div className="seq-plane seq-wall seq-wall-board" />
              <div className="seq-plane seq-wall seq-wall-mirror">
                <MirroredSudoku className="size-full" />
              </div>
            </div>
          </div>
          <Raking aria-hidden="true" className="seq-raking" />
          <ToppledPiece piece="queen" className="seq-piece-a" />
          <ToppledPiece piece="king" className="seq-piece-b" />
          <ToppledPiece piece="pawn" className="seq-piece-c" />
          <div className="seq-hero">
            <Wordmark variant="ink-splat" className="w-full max-w-sm" />
            <Credit
              level={1}
              top="A fan-made puzzle collection"
              bottom="Solve it"
            />
            <p className="max-w-prose">
              Reverse chess, gear puzzles, ciphers and crosswords, in the style
              of the BBC One drama Ludwig.
            </p>
            <Button asChild size="lg">
              <Link href="/puzzles" transitionTypes={["bullet-hole"]}>Enter the Collection</Link>
            </Button>
          </div>
          <Walker
            role="img"
            aria-label="A small silhouette walking across a grid"
            className="seq-walker h-14 w-full border-x-0 bg-background"
          />
          <nav aria-label="Rooms" className="seq-captions">
            {ROOMS.map(({ name, to, href }, index) => (
              <Link
                key={name}
                href={href}
                className={`seq-caption seq-caption-${index + 1}`}
              >
                Room {index + 1}. {name}
                <span className="seq-caption-to"> · {to} →</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <section className="seq-finale">
        <MirroredSudoku className="seq-finale-digits" />
        <div className="seq-finale-copy">
          <Credit level={2} top="Take a seat" bottom="Begin" />
          <Button asChild size="lg">
            <Link href="/puzzles" transitionTypes={["bullet-hole"]}>Open the Collection</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
