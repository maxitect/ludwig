import { Suspense, type ReactNode } from "react";
import { getPuzzlePayload } from "@/lib/data/previews";
import { previews } from "@/puzzles/previews";
import { cn } from "@/utils/cn";

const frameClass = "paper-sheet aspect-4/3 w-24 shrink-0 p-1 sm:w-32";

type PreviewRenderer = (props: { payload: never }) => ReactNode;

/** The shelf thumbnail of a published puzzle: its starting state, from the payload alone. */
export function PuzzleThumbnail({
  typeKey,
  puzzleId,
  className,
}: {
  typeKey: string;
  puzzleId: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn(frameClass, className)}>
      <Suspense fallback={null}>
        <Thumbnail typeKey={typeKey} puzzleId={puzzleId} />
      </Suspense>
    </div>
  );
}

async function Thumbnail({
  typeKey,
  puzzleId,
}: {
  typeKey: string;
  puzzleId: string;
}) {
  if (!Object.hasOwn(previews, typeKey)) return null;
  const payload = await getPuzzlePayload(typeKey, puzzleId);
  const Preview = (previews as Record<string, PreviewRenderer>)[typeKey];
  return <Preview payload={payload as never} />;
}
