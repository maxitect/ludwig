import type { Metadata } from "next";
import Link from "next/link";
import { Credit, Walker, Wordmark } from "@/components/brand";

export const metadata: Metadata = { title: "Offline | Ludwig." };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start gap-6 px-4 py-16">
      <Link href="/" aria-label="Ludwig, home" className="w-24 shrink-0">
        <Wordmark />
      </Link>
      <Credit level={1} top="No connection" bottom="Offline" />
      <Walker aria-label="Waiting for a connection" />
      <p className="max-w-prose text-lg">
        Ludwig cannot reach the network, and this page has not been saved on
        your device. Pages you have already visited still open. Check your
        connection and try again.
      </p>
      <Link
        href="/"
        className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Try the home page
      </Link>
    </main>
  );
}
