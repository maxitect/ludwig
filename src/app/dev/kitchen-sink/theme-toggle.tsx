"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "paper" | "ink";

const subscribe = () => () => {};

function activeTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "paper" || set === "ink") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "ink" : "paper";
}

export function ThemeToggle() {
  const initial = useSyncExternalStore(subscribe, activeTheme, () => "paper");
  const [chosen, setChosen] = useState<Theme | null>(null);
  const theme = chosen ?? initial;

  useEffect(() => {
    if (!chosen) return;
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = chosen;
    return () => {
      if (previous) root.dataset.theme = previous;
      else root.removeAttribute("data-theme");
    };
  }, [chosen]);

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(next) => next && setChosen(next as Theme)}
      aria-label="Theme"
    >
      <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
      <ToggleGroupItem value="ink">Ink</ToggleGroupItem>
    </ToggleGroup>
  );
}
