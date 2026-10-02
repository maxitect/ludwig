"use client";

import { useLayoutEffect } from "react";
import {
  applyTheme,
  readStoredTheme,
  writeThemeCookie,
  type Theme,
} from "@/utils/theme";

/** Re-applies the theme after hydration (strict-mode remounts clear it) and mirrors the signed-in theme into the cookie read by the head script. */
export function ThemeSync({ theme }: { theme?: Theme }) {
  useLayoutEffect(() => {
    if (theme) writeThemeCookie(theme);
    applyTheme(theme ?? readStoredTheme());
  }, [theme]);

  return null;
}
