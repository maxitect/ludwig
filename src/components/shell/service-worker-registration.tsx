"use client";

import { useEffect } from "react";

const register = () => {
  navigator.serviceWorker
    .register("/serwist/sw.js", {
      scope: "/",
      type: "module",
      updateViaCache: "none",
    })
    .catch(() => {});
};

/** The worker is an enhancement, so a browser that refuses it (private modes, blocked storage) just goes without. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
