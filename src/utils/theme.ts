import { themeColors } from "@/config/theme-colors";
import type { userSettings } from "@/db/schema";

export type Theme = typeof userSettings.$inferSelect.theme;

export const THEME_KEY = "theme";

/** Runs in <head> before first paint: the cookie (signed in) wins over localStorage (signed out). Also points every theme-color meta at the chosen theme's paper token. */
export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_KEY}=([^;]*)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem("${THEME_KEY}");if(t==="paper"||t==="ink"){document.documentElement.setAttribute("data-theme",t);var c=({paper:"${themeColors.paper}",ink:"${themeColors.ink}"})[t];var f=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(e){e.setAttribute("content",c)})};f();document.addEventListener("DOMContentLoaded",f)}}catch(e){}})()`;

export function isTheme(value: string | null): value is Theme {
  return value === "paper" || value === "ink" || value === "system";
}

function syncThemeColor(theme: Theme) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const scheme =
        theme === "system"
          ? meta.media.includes("dark")
            ? "ink"
            : "paper"
          : theme;
      meta.content = themeColors[scheme];
    });
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
