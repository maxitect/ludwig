import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function AccountButton({
  name,
  ...props
}: ComponentProps<typeof Button> & { name: string }) {
  return (
    <Button variant="secondary" size="sm" className="max-w-40" {...props}>
      <span className="truncate">{name}</span>
      <ChevronDownIcon aria-hidden="true" />
    </Button>
  );
}
