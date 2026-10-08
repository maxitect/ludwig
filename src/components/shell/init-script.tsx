"use client";

/** Server-rendered only, so it runs before first paint; a client render of the root layout (the not-found error shell) would create an inert copy and log a React error. */
export function InitScript({ html }: { html: string }) {
  if (typeof window !== "undefined") return null;
  return <script dangerouslySetInnerHTML={{ __html: html }} />;
}
