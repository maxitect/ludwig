import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type SolvedIds = Promise<Set<string>>;

/** Awaits the shared solved-ids promise; render each one in its own `<Suspense>`. */
export async function SolvedBadge({
  puzzleId,
  solved,
  className,
}: {
  puzzleId: string;
  solved: SolvedIds;
  className?: string;
}) {
  if (!(await solved).has(puzzleId)) return null;
  return (
    <Badge variant="outline" className={className}>
      <Check aria-hidden="true" />
      Solved
    </Badge>
  );
}

/** Awaits the shared solved-ids promise; renders only when `puzzleIds` is non-empty and every one is solved. */
export async function CompleteBadge({
  puzzleIds,
  solved,
  className,
}: {
  puzzleIds: string[];
  solved: SolvedIds;
  className?: string;
}) {
  const ids = await solved;
  if (puzzleIds.length === 0 || !puzzleIds.every((id) => ids.has(id))) {
    return null;
  }
  return (
    <Badge variant="outline" className={className}>
      <Check aria-hidden="true" />
      Complete
    </Badge>
  );
}
