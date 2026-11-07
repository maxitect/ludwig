import type { Metadata } from "next";
import { Suspense } from "react";
import { GridPaper, Walker } from "@/components/brand";
import { Desk } from "../_components/desk";

export const metadata: Metadata = {
  title: "Your desk | Ludwig.",
  description: "Pick up where you left off, today's dailies and your stats.",
};

export default function DeskPage() {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
        <Suspense fallback={<Walker />}>
          <Desk />
        </Suspense>
      </main>
    </GridPaper>
  );
}
