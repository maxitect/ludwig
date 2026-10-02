"use client";

import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "paper" | "ink";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("paper");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    return () => root.removeAttribute("data-theme");
  }, [theme]);

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(next) => next && setTheme(next as Theme)}
      aria-label="Theme"
    >
      <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
      <ToggleGroupItem value="ink">Ink</ToggleGroupItem>
    </ToggleGroup>
  );
}
