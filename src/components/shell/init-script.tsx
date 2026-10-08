"use client";

/** Server-rendered only: the script runs before first paint, and a client render (e.g. Next dev's error shell) never creates an inert, warning-raising copy. */
export function InitScript({ html }: { html: string }) {
  if (typeof window !== "undefined") return null;
  return <script dangerouslySetInnerHTML={{ __html: html }} />;
}
