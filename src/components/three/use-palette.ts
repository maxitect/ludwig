"use client";

import { useEffect, useState } from "react";
import { readPalette, type Palette } from "./palette";

/** The brand palette as three.js colours; null until mounted, and re-read when the theme changes. */
export function usePalette() {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const read = () => setPalette(readPalette());
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
    });
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", read);
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", read);
    };
  }, []);
  return palette;
}
