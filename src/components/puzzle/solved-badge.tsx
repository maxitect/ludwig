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
