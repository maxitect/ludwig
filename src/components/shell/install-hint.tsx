"use client";

import { XIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const DISMISSED_KEY = "install-hint-dismissed";

function subscribe() {
  return () => {};
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function shouldShow() {
  return isIosSafari() && !isStandalone() && !wasDismissed();
}

/** Renders nothing on the server, so it never mismatches hydration. */
export function InstallHint() {
  const eligible = useSyncExternalStore(subscribe, shouldShow, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (!eligible || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  return (
    <div
      role="note"
      className="mx-4 mb-4 flex items-start gap-3 border-2 border-border p-3 text-sm"
    >
      <p className="flex-1">
        Add Ludwig to your Home Screen: tap Share, then Add to Home Screen.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 hover:bg-foreground hover:text-background focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <XIcon aria-hidden="true" className="size-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
