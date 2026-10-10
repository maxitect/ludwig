"use client";

import {
  type ComponentType,
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const OpenRequested = createContext(false);

/** True when the player pressed the stand-in before the real overlay had loaded, so the overlay opens as it arrives. */
export const useOpenRequested = () => useContext(OpenRequested);

type DeferredProps<P extends object> = {
  load: () => Promise<ComponentType<P>>;
  props: P;
  fallback: ReactNode;
};

/**
 * Shows `fallback` until the component from `load` arrives, which starts after hydration, so its code stays out
 * of the first load. It does not suspend: a Suspense boundary here delays hydration of the whole page.
 */
export function Deferred<P extends object>({
  load,
  props,
  fallback,
}: DeferredProps<P>) {
  const [loaded, setLoaded] = useState<ComponentType<P> | null>(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    let current = true;
    load().then((component) => {
      if (current) setLoaded(() => component);
    });
    return () => {
      current = false;
    };
  }, [load]);

  if (!loaded) {
    return (
      <span className="contents" onClickCapture={() => setRequested(true)}>
        {fallback}
      </span>
    );
  }
  return (
    <OpenRequested value={requested}>{createElement(loaded, props)}</OpenRequested>
  );
}
