import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Credit, Walker } from "@/components/brand";
import { SolvedBadge, type SolvedIds } from "@/components/puzzle/solved-badge";
import { PuzzleThumbnail } from "@/components/puzzle/puzzle-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSolvedPuzzleIds } from "@/lib/data/attempts";
import {
  getDailyDiagram,
  getGearsCatalogue,
  getGearTrainCatalogue,
} from "@/lib/data/gears";
import { londonDate } from "@/utils/london-time";
import { DecorativeGears } from "./decorative-gears";
import "./hub.css";

export const metadata: Metadata = {
  title: "The Gear Puzzle | Ludwig.",
  description:
    "Gears usually just rotate, but these rotate and move in and out. Find the killer.",
};

type Catalogue = Awaited<ReturnType<typeof getGearsCatalogue>>;
type Entry = Omit<Catalogue["diagrams"][number], "fix">;

const headingClass =
  "border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase";

const linkClass =
  "flex items-center justify-between gap-4 py-3 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

const gearHref = (slug: string) => `/puzzles/gears/${slug}`;
const trainHref = (slug: string) => `/puzzles/gear-train/${slug}`;

const HOW_IT_WORKS = [
  "The victim stands at the centre. Each dancer is a gear that watches through its wedge of red Xs.",
  "Turn the crank to set the gears before the dance. Meshed gears turn together, neighbours in opposite directions.",
  "Scrub through the dance. At each of the 8 convergences the dancers close in, and the counter shows how many of them see the victim.",
  "Only one crank setting and one convergence leave a single dancer watching while everyone else looks away. That dancer is the killer.",
  "Leave the crank and the scrubber on that moment, then accuse. The crank, the convergence and the gear must all be right.",
];

const FIX_HOW_IT_WORKS = [
  "As printed, the diagram has no moment where exactly one dancer sees the victim.",
  "Tap two gears to swap their starting slots, up to the number of adjustments allowed.",
  "Only one set of swaps makes the diagram solvable. Then find the crank, the convergence and the killer as usual.",
];

const TRAIN_HOW_IT_WORKS = [
  "The driver turns clockwise. The target has to turn the way its arrow shows.",
  "Place cogs from the tray on free pegs. Cogs mesh when their rims touch, and neighbours turn opposite ways.",
  "Cogs can\u2019t overlap each other or a bolt. A loop with an odd number of cogs jams the train.",
  "Every cog you place must be needed. Only one set of cogs works.",
];

export default async function GearsPage() {
  const [{ diagrams, fixes }, trains] = await Promise.all([
    getGearsCatalogue(),
    getGearTrainCatalogue(),
  ]);
  const solved = getSolvedPuzzleIds(
    [...diagrams, ...fixes, ...trains].map(({ id }) => id),
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
      <section
        aria-labelledby="how-it-works"
        className="relative flex max-w-2xl flex-col gap-4"
      >
        <h2 id="how-it-works" className={headingClass}>
          How it works
        </h2>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          Fix the Diagram
        </h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {FIX_HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          Classic Gear Train
        </h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {TRAIN_HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="today" className="relative flex flex-col gap-4">
        <h2 id="today" className={headingClass}>
          Today&rsquo;s diagram
        </h2>
        <Suspense fallback={<Walker />}>
          <TodaysDiagram />
        </Suspense>
      </section>
      <DiagramSections diagrams={diagrams} fixes={fixes} solved={solved} />
      <TrainSection trains={trains} solved={solved} />
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
                showDifficulty={false}
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

function TrainSection({
  trains,
  solved,
}: {
  trains: Entry[];
  solved: SolvedIds;
}) {
  return (
    <section aria-labelledby="train" className="relative flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-b-2 border-border pb-1">
        <Credit
          id="train"
          level={2}
          top="Mode B"
          bottom="Classic Gear Train"
          className="[&>span:last-child]:text-3xl"
        />
        <p className="text-sm text-muted-foreground">
          The gear puzzle the detectives play at the station. Place cogs on the
          pegboard until the driver turns the target the right way.
        </p>
      </div>
      <Link
        href="/puzzles/gear-train"
        className="flex items-center justify-between gap-4 border-2 border-border p-4 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
          Play Classic Gear Train
        </span>
        <ArrowRight aria-hidden="true" />
      </Link>
      {trains.length > 0 && (
        <EntryList
          entries={trains}
          solved={solved}
          href={trainHref}
          typeKey="gear-train"
        />
      )}
    </section>
  );
}

function EntryList({
  entries,
  solved,
  href = gearHref,
  typeKey = "gears",
  showDifficulty = true,
}: {
  entries: Entry[];
  solved: SolvedIds;
  href?: (slug: string) => string;
  typeKey?: string;
  showDifficulty?: boolean;
}) {
  return (
    <ul className="flex flex-col">
      {entries.map((puzzle) => (
        <li key={puzzle.id} className="border-b-2 border-border">
          <Link href={href(puzzle.slug)} className={linkClass}>
            <PuzzleThumbnail typeKey={typeKey} puzzleId={puzzle.id} />
            <span className="mr-auto font-display text-lg font-semibold tracking-[0.04em] uppercase">
              {puzzle.title}
            </span>
            <span className="flex items-center gap-3">
              <Suspense fallback={null}>
                <SolvedBadge puzzleId={puzzle.id} solved={solved} />
              </Suspense>
              {showDifficulty && (
                <Badge variant="difficulty" level={puzzle.difficulty} />
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
