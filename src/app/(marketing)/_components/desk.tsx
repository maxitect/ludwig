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
      <ContinueShelf continuing={desk.continuing} />
      <FavouritesShelf favourites={desk.favourites} />
      <TodayShelf today={desk.today} />
      <WeekShelf week={desk.week} />
      <Stats stats={desk.stats} />
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

function Stats({ stats }: { stats: DeskData["stats"] }) {
  const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;
  return (
    <Shelf id="stats" title="Your stats">
      {stats.total === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <Walker />
          <p>No cases closed yet. Solve a puzzle and it will be filed here.</p>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Solved" value={String(stats.total)} />
            <Tile label="This week" value={String(stats.thisWeek)} />
            <Tile label="Current streak" value={days(stats.currentStreak)} />
            <Tile label="Longest streak" value={days(stats.longestStreak)} />
          </dl>
          <Link
            href="/casebook"
            className="w-fit font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open the Casebook
          </Link>
        </>
      )}
    </Shelf>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-2 border-border bg-background p-4">
      <dt className="font-display text-lg font-light tracking-[0.04em] uppercase">
        {label}
      </dt>
      <dd className="font-display text-4xl font-bold">{value}</dd>
    </div>
  );
}
