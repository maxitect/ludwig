"use client";

import { useEffect } from "react";
import { visitType } from "@/lib/actions/favourites";

/** Records the visit after hydration, so a prefetch or a cached render never writes. */
export function VisitRecorder({ typeKey }: { typeKey: string }) {
  useEffect(() => {
    void visitType(typeKey);
  }, [typeKey]);
  return null;
}
