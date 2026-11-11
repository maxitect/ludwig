import type { Metadata } from "next";
import Link from "next/link";
import { Credit, GridPaper } from "@/components/brand";

export const metadata: Metadata = {
  title: "Unsubscribed | Ludwig.",
  robots: { index: false },
};

export default function UnsubscribedPage() {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12 sm:px-8">
        <Credit level={1} top="Email" bottom="Unsubscribed" />
        <p>
          You won&apos;t get those emails any more. You can turn them back on
          in{" "}
          <Link href="/settings" className="font-semibold underline">
            Settings
          </Link>
          .
        </p>
      </main>
    </GridPaper>
  );
}
