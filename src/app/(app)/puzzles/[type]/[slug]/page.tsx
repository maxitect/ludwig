import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Walker } from "@/components/brand";
import { SolveChrome } from "@/components/puzzle/solve-chrome";
import {
  getPuzzleStaticParams,
  getPuzzleSummary,
} from "@/lib/data/catalogue";
import { getAttemptState } from "@/lib/data/attempts";
import { getPuzzleForPlay } from "@/lib/data/puzzles";
import { getCurrentUser, getUserChessNotation } from "@/lib/data/user";

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
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-8 touch:h-dvh touch:max-w-none touch:gap-0 touch:overflow-hidden touch:p-0">
      <Suspense
        fallback={
          <div className="min-h-dvh">
            <Walker />
          </div>
        }
      >
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
  const [initialState, chessNotation] = user
    ? await Promise.all([
        getAttemptState(user.id, play.puzzle.id),
        getUserChessNotation(user.id),
      ])
    : [null, undefined];

  return (
    <SolveChrome
      puzzleId={play.puzzle.id}
      typeKey={typeKey}
      typeName={summary.typeName}
      category={summary.categoryName}
      title={summary.title}
      difficulty={summary.difficulty}
      payload={play.payload}
      initialState={initialState}
      signedIn={user !== null}
      chessNotation={chessNotation}
      signInHref={`/sign-in?next=${encodeURIComponent(`/puzzles/${typeKey}/${slug}`)}`}
      nextHref={
        summary.next ? `/puzzles/${summary.next.typeKey}/${summary.next.slug}` : null
      }
    />
  );
}
