import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Credit, Walker } from "@/components/brand";
import { SolvedBadge, type SolvedIds } from "@/components/puzzle/solved-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSolvedPuzzleIds } from "@/lib/data/attempts";
import { getDailyDiagram, getGearsCatalogue } from "@/lib/data/gears";
import { londonDate } from "@/utils/london-time";
import { DecorativeGears } from "./decorative-gears";
import "./hub.css";

export const metadata: Metadata = {
  title: "The Gear Puzzle | Ludwig.",
  description:
    "Gears usually just rotate, but these rotate and move in and out. Find the killer.",
};

type Catalogue = Awaited<ReturnType<typeof getGearsCatalogue>>;
type Entry = Catalogue["diagrams"][number];

const headingClass =
  "border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase";

const linkClass =
  "flex items-center justify-between gap-4 py-3 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

const gearHref = (slug: string) => `/puzzles/gears/${slug}`;

export default async function GearsPage() {
  const { diagrams, fixes } = await getGearsCatalogue();
  const solved = getSolvedPuzzleIds(
    [...diagrams, ...fixes].map(({ id }) => id),
  );

  return (
    <main className="relative mx-auto flex max-w-5xl flex-col gap-10 overflow-x-clip px-4 py-12 sm:px-8">
      <DecorativeGears />
      <header className="relative flex flex-col gap-2">
        <Credit level={1} top="The" bottom="Gear Puzzle" />
        <p className="text-sm text-muted-foreground italic">
          <a
            href="#show-quote"
            className="underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            (definitely not &ldquo;Slidey Circles&rdquo;)
          </a>
        </p>
      </header>
      <Card className="relative max-w-2xl">
        <CardContent>
          <blockquote id="show-quote" className="flex flex-col gap-2">
            <p className="font-display text-2xl font-bold tracking-[0.04em] uppercase">
              &ldquo;Gears usually just rotate, but these rotate AND move in and
              out.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">John, Ludwig</footer>
          </blockquote>
        </CardContent>
      </Card>
      <section aria-labelledby="today" className="relative flex flex-col gap-4">
        <h2 id="today" className={headingClass}>
          Today&rsquo;s diagram
        </h2>
        <Suspense fallback={<Walker />}>
          <TodaysDiagram />
        </Suspense>
      </section>
      <DiagramSections diagrams={diagrams} fixes={fixes} solved={solved} />
    </main>
  );
}

async function TodaysDiagram() {
  await connection();
  const puzzle = await getDailyDiagram(londonDate(new Date()));
  if (!puzzle) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-3">
        <Walker aria-label="No diagram yet" />
        <p>Today&rsquo;s diagram hasn&rsquo;t been drawn yet. Check back soon.</p>
      </div>
    );
  }
  const solved = getSolvedPuzzleIds([puzzle.id]);
  return (
    <Card variant="book" className="max-w-md">
      <CardContent className="flex flex-col gap-3">
        <Link
          href={gearHref(puzzle.slug)}
          className="font-display text-2xl font-bold tracking-[0.04em] uppercase after:absolute after:inset-0 focus-visible:outline-none"
        >
          {puzzle.title}
        </Link>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="difficulty" level={puzzle.difficulty} />
          <Suspense fallback={null}>
            <SolvedBadge
              puzzleId={puzzle.id}
              solved={solved}
              className="bg-paper text-ink"
            />
          </Suspense>
        </div>
      </CardContent>
    </Card>
  );
}

function DiagramSections({
  diagrams,
  fixes,
  solved,
}: Catalogue & { solved: SolvedIds }) {
  const levels = [...new Set(diagrams.map(({ difficulty }) => difficulty))];
  return (
    <>
      <section
        aria-labelledby="diagrams"
        className="relative flex flex-col gap-4"
      >
        <h2 id="diagrams" className={headingClass}>
          Diagrams
        </h2>
        {diagrams.length === 0 ? (
          <p>No diagrams have been published yet.</p>
        ) : (
          levels.map((level) => (
            <div key={level} className="flex flex-col gap-1">
              <h3 className="flex items-center gap-3 font-display text-lg font-bold tracking-[0.04em] uppercase">
                Difficulty
                <Badge variant="difficulty" level={level} />
              </h3>
              <EntryList
                entries={diagrams.filter(({ difficulty }) => difficulty === level)}
                solved={solved}
              />
            </div>
          ))
        )}
      </section>
      <section aria-labelledby="fix" className="relative flex flex-col gap-4">
        <h2 id="fix" className={headingClass}>
          Fix the Diagram
        </h2>
        <p className="text-sm text-muted-foreground">
          The diagram is nearly right. Swap gears between slots to repair it.
        </p>
        {fixes.length === 0 ? (
          <p>No repairs have been published yet.</p>
        ) : (
          <EntryList entries={fixes} solved={solved} />
        )}
      </section>
    </>
  );
}

function EntryList({
  entries,
  solved,
}: {
  entries: Entry[];
  solved: SolvedIds;
}) {
  return (
    <ul className="flex flex-col">
      {entries.map((puzzle) => (
        <li key={puzzle.id} className="border-b-2 border-border">
          <Link href={gearHref(puzzle.slug)} className={linkClass}>
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
  );
}
