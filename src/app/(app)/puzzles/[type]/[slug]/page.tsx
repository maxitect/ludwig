import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Credit, Walker } from "@/components/brand";
import { SolveChrome } from "@/components/puzzle/solve-chrome";
import { Badge } from "@/components/ui/badge";
import {
  getPuzzleStaticParams,
  getPuzzleSummary,
} from "@/lib/data/catalogue";
import { getAttemptState } from "@/lib/data/attempts";
import { getPuzzleForPlay } from "@/lib/data/puzzles";
import { getCurrentUser } from "@/lib/data/user";
import { getSolver } from "@/puzzles/solvers";

export const generateStaticParams = getPuzzleStaticParams;

/** Unknown params must 404 with a real status, so the page resolves them before streaming. */
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/puzzles/[type]/[slug]">): Promise<Metadata> {
  const { type, slug } = await params;
  const summary = await getPuzzleSummary(type, slug);
  if (!summary) return {};
  return {
    title: `${summary.title} | ${summary.typeName} | Ludwig.`,
    description: `${summary.typeName}: ${summary.title}`,
  };
}

export default async function SolvePage({
  params,
}: PageProps<"/puzzles/[type]/[slug]">) {
  const { type, slug } = await params;
  const summary = await getPuzzleSummary(type, slug);
  if (!summary) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-8">
      <Suspense fallback={<Walker />}>
        <Solve typeKey={type} slug={slug} summary={summary} />
      </Suspense>
    </main>
  );
}

async function Solve({
  typeKey,
  slug,
  summary,
}: {
  typeKey: string;
  slug: string;
  summary: NonNullable<Awaited<ReturnType<typeof getPuzzleSummary>>>;
}) {
  const [play, user] = await Promise.all([
    getPuzzleForPlay(typeKey, slug),
    getCurrentUser(),
  ]);
  if (!play) notFound();
  const Solver = getSolver(typeKey);
  const initialState = user
    ? await getAttemptState(user.id, play.puzzle.id)
    : null;

  if (!Solver) {
    return (
      <section className="flex flex-col gap-4">
        <Credit
          level={1}
          top={summary.categoryName}
          bottom={summary.title}
          className="[&>span:last-child]:text-4xl [&>span:last-child]:break-words sm:[&>span:last-child]:text-5xl"
        />
        <Badge variant="difficulty" level={summary.difficulty} />
        <p>The solver for {summary.typeName} is not open yet.</p>
      </section>
    );
  }

  return (
    <SolveChrome
      puzzleId={play.puzzle.id}
      category={summary.categoryName}
      title={summary.title}
      difficulty={summary.difficulty}
      payload={play.payload}
      initialState={initialState}
      Solver={Solver}
      signedIn={user !== null}
      signInHref={`/sign-in?next=${encodeURIComponent(`/puzzles/${typeKey}/${slug}`)}`}
      nextHref={
        summary.next ? `/puzzles/${summary.next.typeKey}/${summary.next.slug}` : null
      }
    />
  );
}
