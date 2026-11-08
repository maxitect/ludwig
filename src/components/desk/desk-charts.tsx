"use client";

import dynamic from "next/dynamic";
import { Walker } from "@/components/brand";

const ChartsView = dynamic(() => import("./charts-view"), {
  ssr: false,
  loading: () => (
    <div className="min-h-96">
      <Walker />
    </div>
  ),
});

/** The only door to D3: the charts load in their own chunk, after the Desk's shelves. */
export function DeskCharts(props: React.ComponentProps<typeof ChartsView>) {
  return <ChartsView {...props} />;
}
