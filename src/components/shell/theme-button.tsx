import { SunMoonIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function ThemeButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="secondary" size="sm" aria-label="Theme" {...props}>
      <SunMoonIcon aria-hidden="true" />
    </Button>
  );
}
