import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Credit, GridPaper, Walker } from "@/components/brand";
import { getCasebook } from "@/lib/data/casebook";
import { getCurrentUser } from "@/lib/data/user";
import { formatDuration } from "@/utils/format-duration";

export const metadata: Metadata = {
  title: "Casebook | Ludwig.",
  description: "Your solves, times and streaks.",
};

const solvedOn = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function CasebookPage() {
  return (
    <GridPaper className="min-h-full">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
        <Credit level={1} top="Your progress" bottom="Casebook" />
        <Suspense fallback={<Walker />}>
          <Casebook />
        </Suspense>
      </main>
    </GridPaper>
  );
}

async function Casebook() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/casebook");
  const casebook = await getCasebook(user.id);

  if (casebook.recent.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Walker />
        <p>No cases closed yet. Solve a puzzle and it will be filed here.</p>
        <Link
          href="/puzzles"
          className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Open the Collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <section aria-label="Streaks" className="grid gap-4 sm:grid-cols-2">
        <StreakTile label="Current streak" days={casebook.currentStreak} />
        <StreakTile label="Longest streak" days={casebook.longestStreak} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase">
          By category
        </h2>
        <div className="overflow-x-auto bg-background">
          <table className="w-full border-2 border-border text-left">
            <thead className="bg-muted">
              <tr className="border-b-2 border-border">
                <th scope="col" className="p-3">
                  Category
                </th>
                <th scope="col" className="p-3">
                  Solved
                </th>
                <th scope="col" className="p-3">
                  Median
                </th>
                <th scope="col" className="p-3">
                  Best
                </th>
                <th scope="col" className="p-3">
                  Avg hints
                </th>
              </tr>
            </thead>
            <tbody>
              {casebook.categories.map((category) => (
                <tr key={category.key} className="border-b border-border">
                  <th scope="row" className="p-3 font-bold">
                    {category.name}
                  </th>
                  <td className="p-3">{category.solves}</td>
                  <td className="p-3">
                    {formatDuration(category.medianDurationMs)}
                  </td>
                  <td className="p-3">
                    {formatDuration(category.bestDurationMs)}
                  </td>
                  <td className="p-3">{category.avgHints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase">
          Recent solves
        </h2>
        <ul className="flex flex-col gap-2">
          {casebook.recent.map((solve) => (
            <li key={solve.attemptId}>
              <Link
                href={`/puzzles/${solve.typeKey}/${solve.puzzleSlug}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-2 border-border bg-background p-3 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex flex-col">
                  <span className="font-display text-lg font-bold tracking-[0.04em] uppercase">
                    {solve.puzzleTitle}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {solve.typeName} · {solvedOn.format(solve.completedAt)}
                  </span>
                </span>
                <span className="text-sm">
                  {formatDuration(solve.durationMs)} · {solve.hints}{" "}
                  {solve.hints === 1 ? "hint" : "hints"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function StreakTile({ label, days }: { label: string; days: number }) {
  return (
    <div className="flex flex-col border-2 border-border bg-background p-4">
      <span className="font-display text-lg font-light tracking-[0.04em] uppercase">
        {label}
      </span>
      <span className="font-display text-5xl font-bold">
        {days} {days === 1 ? "day" : "days"}
      </span>
    </div>
  );
}
