import type { Metadata } from "next";
import Link from "next/link";
import { Credit, Walker } from "@/components/brand";
import { TypeThumbnail } from "@/components/puzzle/puzzle-thumbnail";
import { Badge } from "@/components/ui/badge";
import { getCatalogue } from "@/lib/data/catalogue";

type CatalogueType = Awaited<
  ReturnType<typeof getCatalogue>
>[number]["types"][number];

export const metadata: Metadata = {
  title: "The Collection | Ludwig.",
  description: "Every puzzle type in the pocket collection, by category.",
};

export default async function PuzzlesPage() {
  const categories = await getCatalogue();
  const hasPuzzles = categories.some(({ types }) =>
    types.some(({ published }) => published > 0),
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
      <Credit level={1} top="Pocket puzzles" bottom="The Collection" />
      {!hasPuzzles && (
        <div className="flex flex-col items-start gap-3">
          <Walker />
          <p>No puzzles have been published yet. Check back soon.</p>
        </div>
      )}
      {categories.map((category) => (
        <section
          key={category.key}
          id={category.key}
          className="flex scroll-mt-24 flex-col gap-4"
        >
          <h2 className="border-b-2 border-border pb-1 font-display text-2xl font-bold tracking-[0.04em] uppercase">
            {category.name}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {category.types.map((type) => (
              <li key={type.key}>
                {type.published > 0 ? (
                  <Link
                    href={`/puzzles/${type.key}`}
                    className="flex h-full flex-col gap-2 border-2 border-border p-4 hover:bg-muted focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <TypeCardBody
                      type={type}
                      status={`${type.published} published`}
                    />
                  </Link>
                ) : (
                  <div
                    data-testid="coming-soon"
                    className="flex h-full flex-col gap-2 border-2 border-dashed border-muted-foreground p-4 text-muted-foreground"
                  >
                    <TypeCardBody type={type} status="Coming soon" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function TypeCardBody({
  type,
  status,
}: {
  type: CatalogueType;
  status: string;
}) {
  return (
    <>
      <TypeThumbnail
        typeKey={type.key}
        puzzleId={type.representativeId}
        className="w-full max-w-60 sm:w-full"
      />
      <span className="flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold tracking-[0.04em] uppercase">
          {type.name}
        </span>
        <Badge variant="outline">{status}</Badge>
      </span>
      <span className="text-sm text-muted-foreground">{type.description}</span>
    </>
  );
}
