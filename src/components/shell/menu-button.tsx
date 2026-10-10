import { MenuIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function MenuButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="secondary" size="sm" className="md:hidden" {...props}>
      <MenuIcon aria-hidden="true" />
      <span className="sr-only">Menu</span>
    </Button>
  );
}
