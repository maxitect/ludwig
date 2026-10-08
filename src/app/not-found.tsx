import type { Metadata } from "next";
import Link from "next/link";
import { Credit } from "@/components/brand";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-6 px-4 py-16">
        <Credit level={1} top="Error 404" bottom="Not found" />
        <p className="max-w-prose text-lg">
          There is no page here. The puzzle you are looking for may have moved,
          or never existed.
        </p>
        <Link href="/puzzles" className="underline underline-offset-4">
          Back to the Collection
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
