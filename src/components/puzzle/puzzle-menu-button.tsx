import { EllipsisVerticalIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function PuzzleMenuButton(props: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Puzzle menu"
      className="hidden touch:inline-flex"
      {...props}
    >
      <EllipsisVerticalIcon aria-hidden="true" />
    </Button>
  );
}
