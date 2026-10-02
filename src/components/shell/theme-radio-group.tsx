"use client";

import { useState } from "react";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { saveTheme } from "@/lib/actions/theme";
import {
  THEME_KEY,
  applyTheme,
  isTheme,
  readStoredTheme,
  writeThemeCookie,
  type Theme,
} from "@/utils/theme";

const options: { value: Theme; label: string }[] = [
  { value: "paper", label: "Paper" },
  { value: "ink", label: "Ink" },
  { value: "system", label: "System" },
];

type ThemeRadioGroupProps = { persistedTheme?: Theme };

/** Signed in (`persistedTheme` set) saves to user_settings; signed out saves to localStorage. */
export function ThemeRadioGroup({ persistedTheme }: ThemeRadioGroupProps) {
  const [theme, setTheme] = useState<Theme>(
    () => persistedTheme ?? readStoredTheme(),
  );
  const [failed, setFailed] = useState(false);

  async function choose(value: string) {
    if (!isTheme(value)) return;
    const previous = theme;
    setFailed(false);
    setTheme(value);
    applyTheme(value);
    if (!persistedTheme) {
      localStorage.setItem(THEME_KEY, value);
      return;
    }
    writeThemeCookie(value);
    try {
      await saveTheme({ theme: value });
    } catch {
      setTheme(previous);
      applyTheme(previous);
      writeThemeCookie(previous);
      setFailed(true);
    }
  }

  return (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={choose}>
        {options.map(({ value, label }) => (
          <DropdownMenuRadioItem key={value} value={value}>
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {failed && (
        <p role="alert" className="px-2 py-1.5 text-sm font-semibold underline decoration-2 underline-offset-4">
          Could not save your theme.
        </p>
      )}
    </>
  );
}
