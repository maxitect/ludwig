import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Credit, Walker } from "@/components/brand";
import { SolvedBadge, type SolvedIds } from "@/components/puzzle/solved-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSolvedPuzzleIds } from "@/lib/data/attempts";
import { getWeeklySchedule } from "@/lib/data/weekly";
import { londonWeekStart } from "@/utils/london-time";

export const metadata: Metadata = {
  title: "This Week | Ludwig.",
  description: "Two puzzles a week: the current pair and every pair before it.",
};

type Week = Awaited<ReturnType<typeof getWeeklySchedule>>[number];
type WeekPuzzle = Week["puzzles"][number];

const headingClass =
  "border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase";

const focusClass =
  "focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function formatWeek(weekStart: string) {
  return new Date(`${weekStart}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const puzzleHref = ({ typeKey, slug }: WeekPuzzle) =>
  `/puzzles/${typeKey}/${slug}`;

export default function ThisWeekPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
      <header className="flex flex-col gap-3">
        <Credit level={1} top="This" bottom="Week" />
        <p>Two puzzles a week, every Monday.</p>
      </header>
      <Suspense fallback={<Walker />}>
        <Schedule />
      </Suspense>
    </main>
  );
}

async function Schedule() {
  await connection();
  const currentWeekStart = londonWeekStart(new Date());
  const weeks = await getWeeklySchedule(currentWeekStart);
  const current = weeks.find(({ weekStart }) => weekStart === currentWeekStart);
  const previous = weeks.filter(({ weekStart }) => weekStart !== currentWeekStart);
  const solved = getSolvedPuzzleIds(
    weeks.flatMap(({ puzzles }) => puzzles.map(({ id }) => id)),
  );

  return (
    <>
      <section aria-labelledby="current-week" className="flex flex-col gap-4">
        <h2 id="current-week" className={headingClass}>
          Week of {formatWeek(currentWeekStart)}
        </h2>
        {current ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {current.puzzles.map((puzzle) => (
              <li key={puzzle.id}>
                <Card variant="book" className="h-full">
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={puzzleHref(puzzle)}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {puzzle.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>{puzzle.type.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <Badge variant="difficulty" level={puzzle.difficulty} />
                    <Suspense fallback={null}>
                      <SolvedBadge
                        puzzleId={puzzle.id}
                        solved={solved}
                        className="bg-paper text-ink"
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pair has been set for this week yet.</p>
        )}
      </section>
      {previous.length > 0 && (
        <section aria-labelledby="previous-weeks" className="flex flex-col gap-4">
          <h2 id="previous-weeks" className={headingClass}>
            Previous weeks
          </h2>
          <ul className="flex flex-col">
            {previous.map(({ weekStart, puzzles }) => (
              <li
                key={weekStart}
                className="flex flex-col gap-1 border-b-2 border-border py-3"
              >
                <h3 className="font-display text-sm font-light tracking-[0.04em] uppercase">
                  Week of {formatWeek(weekStart)}
                </h3>
                <ul className="flex flex-col">
                  {puzzles.map((puzzle) => (
                    <li key={puzzle.id}>
                      <Link
                        href={puzzleHref(puzzle)}
                        className={`flex items-center justify-between gap-4 py-1 hover:bg-muted ${focusClass}`}
                      >
                        <span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
                          {puzzle.title}
                          <span className="ml-3 text-sm font-light">
                            {puzzle.type.name}
                          </span>
                        </span>
                        <Suspense fallback={null}>
                          <SolvedBadge puzzleId={puzzle.id} solved={solved} />
                        </Suspense>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
