import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { Credit, Walker } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTypeCatalogue, getTypeStaticParams } from "@/lib/data/catalogue";

const DIFFICULTIES = [1, 2, 3, 4, 5];

const difficultySchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(5)
  .optional()
  .catch(undefined);

export const generateStaticParams = getTypeStaticParams;

export async function generateMetadata({
  params,
}: PageProps<"/puzzles/[type]">): Promise<Metadata> {
  const catalogue = await getTypeCatalogue((await params).type);
  if (!catalogue) return {};
  return {
    title: `${catalogue.type.name} | Ludwig.`,
    description: catalogue.type.description,
  };
}

export default async function TypePage({
  params,
  searchParams,
}: PageProps<"/puzzles/[type]">) {
  const { type: typeKey } = await params;
  const catalogue = await getTypeCatalogue(typeKey);
  if (!catalogue) notFound();
  const { type, volumes } = catalogue;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
      <header className="flex flex-col gap-3">
        <Credit level={1} top={type.category.name} bottom={type.name} />
        <p>{type.description}</p>
      </header>
      {volumes.length > 0 && (
        <section aria-labelledby="volumes" className="flex flex-col gap-4">
          <h2
            id="volumes"
            className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase"
          >
            Volumes
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {volumes.map((volume) => (
              <li key={volume.id}>
                <Card variant="book" className="h-full">
                  <CardHeader>
                    <CardTitle>{volume.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {volume.puzzleCount}{" "}
                    {volume.puzzleCount === 1 ? "puzzle" : "puzzles"}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Suspense fallback={<Walker />}>
        <PuzzleList
          typeKey={type.key}
          puzzles={catalogue.puzzles}
          searchParams={searchParams}
        />
      </Suspense>
    </main>
  );
}

async function PuzzleList({
  typeKey,
  puzzles,
  searchParams,
}: {
  typeKey: string;
  puzzles: NonNullable<Awaited<ReturnType<typeof getTypeCatalogue>>>["puzzles"];
  searchParams: PageProps<"/puzzles/[type]">["searchParams"];
}) {
  const { difficulty: rawDifficulty } = await searchParams;
  const difficulty = difficultySchema.parse(
    Array.isArray(rawDifficulty) ? rawDifficulty[0] : rawDifficulty,
  );
  const shown = difficulty
    ? puzzles.filter((puzzle) => puzzle.difficulty === difficulty)
    : puzzles;

  return (
    <section aria-labelledby="puzzle-list" className="flex flex-col gap-4">
      <h2
        id="puzzle-list"
        className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase"
      >
        Puzzles
      </h2>
      <nav aria-label="Filter by difficulty" className="flex flex-wrap gap-2">
        {[undefined, ...DIFFICULTIES].map((level) => (
          <Link
            key={level ?? "all"}
            href={
              level ? `/puzzles/${typeKey}?difficulty=${level}` : `/puzzles/${typeKey}`
            }
            aria-current={level === difficulty ? "true" : undefined}
            className={buttonVariants({
              variant: level === difficulty ? "default" : "secondary",
              size: "sm",
            })}
          >
            {level ? `Difficulty ${level}` : "All"}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p>
          {puzzles.length === 0
            ? "No puzzles of this type have been published yet."
            : "No puzzles match this difficulty."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((puzzle) => (
            <li key={puzzle.slug} className="border-b-2 border-border">
              <Link
                href={`/puzzles/${typeKey}/${puzzle.slug}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
                  {puzzle.title}
                </span>
                <Badge variant="difficulty" level={puzzle.difficulty} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
