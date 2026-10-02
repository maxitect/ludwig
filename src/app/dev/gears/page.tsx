import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Credit } from "@/components/brand";
import { env } from "@/env";
import { Playground } from "./playground";

export const metadata: Metadata = {
  title: "Gear playtest",
};

export default function GearsPlaytestPage() {
  if (env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-8">
      <Credit level={1} top="Dev only" bottom="Gear playtest" />
      <Playground />
    </main>
  );
}
