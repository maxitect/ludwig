import type { userSettings } from "@/db/schema";

export type Theme = typeof userSettings.$inferSelect.theme;

export const THEME_KEY = "theme";

/** Runs in <head> before first paint: the cookie (signed in) wins over localStorage (signed out). */
export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_KEY}=([^;]*)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem("${THEME_KEY}");if(t==="paper"||t==="ink")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function isTheme(value: string | null): value is Theme {
  return value === "paper" || value === "ink" || value === "system";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return isTheme(stored) ? stored : "system";
}

export function writeThemeCookie(theme: Theme | null) {
  document.cookie = `${THEME_KEY}=${theme ?? ""}; path=/; max-age=${theme ? 31536000 : 0}; SameSite=Lax`;
}
