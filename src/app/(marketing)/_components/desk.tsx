import Link from "next/link";
import { Check } from "lucide-react";
import { Credit, GridPaper, Walker } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PuzzleThumbnail } from "@/components/puzzle/puzzle-thumbnail";
import { DeskCharts } from "@/components/desk/desk-charts";
import { DeskHero } from "@/components/desk/desk-scene/desk-hero";
import { deskStacks } from "@/components/desk/desk-scene/model";
import { StatTiles } from "@/components/desk/stat-tiles";
import { CHARTS_MIN_SOLVES } from "@/config/desk";
import { getDesk } from "@/lib/data/desk";
import { getCurrentUser } from "@/lib/data/user";
import { TitleSequence } from "./title-sequence";

type DeskData = Awaited<ReturnType<typeof getDesk>>;
type PuzzleCardProps = {
  href: string;
  title: string;
  typeName: string;
  difficulty: number | null;
  note?: string;
  solved?: boolean;
};

const headingClass =
  "border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase";

const touched = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const puzzleHref = (puzzle: { typeKey: string; slug: string }) =>
  `/puzzles/${puzzle.typeKey}/${puzzle.slug}`;

/**
 * A stale session cookie lands here through the proxy rewrite, so it shows the landing instead of redirecting back.
 * Checks the session row as `getDesk` does, so a revoked session inside the cookie cache also gets the landing.
 */
export async function Desk() {
  if (!(await getCurrentUser({ disableCookieCache: true }))) {
    return <TitleSequence />;
  }
  const desk = await getDesk();

  return (
    <DeskFrame>
      <Credit level={1} top="Your desk" bottom={desk.name} />
      <DeskHero stacks={deskStacks(desk.charts.categories)} />
      <ContinueShelf continuing={desk.continuing} />
      <FavouritesShelf favourites={desk.favourites} />
      <TodayShelf today={desk.today} />
      <WeekShelf week={desk.week} />
      <RecommendedShelf recommended={desk.recommended} />
      <Stats stats={desk.stats} charts={desk.charts} />
    </DeskFrame>
  );
}

export function DeskFrame({ children }: { children: React.ReactNode }) {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
        {children}
      </main>
    </GridPaper>
  );
}

function PuzzleCard({
  href,
  title,
  typeName,
  difficulty,
  note,
  solved,
}: PuzzleCardProps) {
  return (
    <Card variant="book" className="h-full">
      <CardHeader>
        <CardTitle>
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </Link>
        </CardTitle>
        <CardDescription>
          {typeName}
          {note ? ` · ${note}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        {difficulty !== null && <Badge variant="difficulty" level={difficulty} />}
        {solved && (
          <Badge variant="outline" className="bg-paper text-ink">
            <Check aria-hidden="true" />
            Solved
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function Shelf({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className={headingClass}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContinueShelf({ continuing }: { continuing: DeskData["continuing"] }) {
  return (
    <Shelf id="continue" title="Continue">
      {continuing.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <Walker />
          <p>Nothing in progress. Start a puzzle and it will wait here.</p>
          <Link
            href="/puzzles"
            className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open the Collection
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {continuing.map(({ puzzle, lastSavedAt }) => (
            <li key={puzzleHref(puzzle)}>
              <PuzzleCard
                href={puzzleHref(puzzle)}
                title={puzzle.title}
                typeName={puzzle.type.name}
                difficulty={puzzle.difficulty}
                note={touched.format(lastSavedAt)}
              />
            </li>
          ))}
        </ul>
      )}
    </Shelf>
  );
}

function FavouritesShelf({
  favourites,
}: {
  favourites: DeskData["favourites"];
}) {
  return (
    <Shelf id="favourites" title="Your favourites">
      {favourites.length === 0 ? (
        <p>
          Star a puzzle type in{" "}
          <Link
            href="/puzzles"
            className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            the Collection
          </Link>{" "}
          and it will wait here.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favourites.map((favourite) => (
            <li key={favourite.key}>
              <Card variant="book" className="h-full">
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/puzzles/${favourite.key}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {favourite.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {favourite.newest
                      ? `Newest: ${favourite.newest.title}`
                      : "Nothing published yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">
                    {favourite.fresh} new since your last visit
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Shelf>
  );
}

function PuzzleList({ puzzles }: { puzzles: DeskData["today"] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {puzzles.map((puzzle) => (
        <li key={puzzle.id}>
          <PuzzleCard
            href={puzzleHref(puzzle)}
            title={puzzle.title}
            typeName={puzzle.type.name}
            difficulty={puzzle.difficulty}
            solved={puzzle.solved}
          />
        </li>
      ))}
    </ul>
  );
}

function TodayShelf({ today }: { today: DeskData["today"] }) {
  return (
    <Shelf id="today" title="Today">
      {today.length === 0 ? (
        <p>No dailies are out yet today.</p>
      ) : (
        <PuzzleList puzzles={today} />
      )}
    </Shelf>
  );
}

function WeekShelf({ week }: { week: DeskData["week"] }) {
  return (
    <Shelf id="this-week" title="This week">
      {week.length === 0 ? (
        <p>No pair has been set for this week yet.</p>
      ) : (
        <PuzzleList puzzles={week} />
      )}
    </Shelf>
  );
}

function RecommendedShelf({
  recommended,
}: {
  recommended: DeskData["recommended"];
}) {
  if (recommended.picks.length === 0) return null;
  return (
    <Shelf id="recommended" title="Recommended for you">
      {recommended.coldStart && (
        <p>Popular starts: the puzzles most players begin with.</p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommended.picks.map((pick) => (
          <li key={pick.id}>
            <Card variant="book" className="h-full">
              <CardHeader className="flex-row items-start gap-3">
                <PuzzleThumbnail
                  typeKey={pick.typeKey}
                  puzzleId={pick.id}
                  className="w-20 sm:w-20"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle>
                    <Link
                      href={puzzleHref(pick)}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {pick.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>{pick.typeName}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-2">
                <Badge variant="difficulty" level={pick.difficulty} />
                <p className="text-sm font-semibold">{pick.reason}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Shelf>
  );
}

function Stats({
  stats,
  charts,
}: {
  stats: DeskData["stats"];
  charts: DeskData["charts"];
}) {
  return (
    <Shelf id="stats" title="Your stats">
      <StatTiles
        stats={stats}
        categories={charts.categories}
        fastest={charts.fastest}
      />
      {stats.total < CHARTS_MIN_SOLVES ? (
        <div className="flex flex-col items-start gap-3">
          <Walker />
          <p>Solve a few more and the charts fill in.</p>
        </div>
      ) : (
        <DeskCharts charts={charts} currentStreak={stats.currentStreak} />
      )}
      <Link
        href="/casebook"
        className="w-fit font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Open the Casebook
      </Link>
    </Shelf>
  );
}
