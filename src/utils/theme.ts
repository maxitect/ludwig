import { themeColors } from "@/config/theme-colors";
import type { userSettings } from "@/db/schema";

export type Theme = typeof userSettings.$inferSelect.theme;

export const THEME_KEY = "theme";

const THEME_COLOR_ID = "theme-color-override";

/** Lowercase so React, which matches hoisted metas by name and content, never claims the override as one of its own. */
const overrideColors = {
  paper: themeColors.paper.toLowerCase(),
  ink: themeColors.ink.toLowerCase(),
};

/** Runs in <head> before first paint: the cookie (signed in) wins over localStorage (signed out). A chosen theme also prepends its own theme-color meta, which outranks the media-query metas React owns. */
export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_KEY}=([^;]*)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem("${THEME_KEY}");if(t==="paper"||t==="ink"){document.documentElement.setAttribute("data-theme",t);var e=document.createElement("meta");e.id="${THEME_COLOR_ID}";e.name="theme-color";e.content=${JSON.stringify(overrideColors)}[t];document.head.prepend(e)}}catch(e){}})()`;

export function isTheme(value: string | null): value is Theme {
  return value === "paper" || value === "ink" || value === "system";
}

function syncThemeColor(theme: Theme) {
  let meta = document.querySelector<HTMLMetaElement>(`#${THEME_COLOR_ID}`);
  if (theme === "system") {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement("meta");
    meta.id = THEME_COLOR_ID;
    meta.name = "theme-color";
    document.head.prepend(meta);
  }
  meta.content = overrideColors[theme];
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  syncThemeColor(theme);
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeThemeCookie(theme: Theme | null) {
  document.cookie = `${THEME_KEY}=${theme ?? ""}; path=/; max-age=${theme ? 31536000 : 0}; SameSite=Lax`;
}
