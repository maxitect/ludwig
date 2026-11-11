import type { Metadata } from "next";
import { Suspense } from "react";
import { Credit, GridPaper, Walker } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { unsubscribe } from "@/lib/actions/unsubscribe";
import { readUnsubscribeToken } from "@/lib/email/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe | Ludwig.",
  robots: { index: false },
};

const kindLabels = {
  favourites: "emails about new puzzles in your favourite types",
  streak: "reminders before your streak breaks",
} as const;

/** Opening the link only asks: mail scanners prefetch links, so the setting changes on the button's POST. */
async function Confirm({
  searchParams,
}: Pick<PageProps<"/unsubscribe">, "searchParams">) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  const parsed = value ? readUnsubscribeToken(value) : null;
  if (!value || !parsed) {
    return (
      <p
        role="alert"
        className="border-2 border-border bg-destructive p-3 text-destructive-foreground"
      >
        This link is not valid.
      </p>
    );
  }
  return (
    <form action={unsubscribe} className="flex flex-col items-start gap-6">
      <input type="hidden" name="token" value={value} />
      <p>Stop {kindLabels[parsed.kind]}?</p>
      <Button type="submit">Unsubscribe</Button>
    </form>
  );
}

export default function UnsubscribePage({
  searchParams,
}: PageProps<"/unsubscribe">) {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12 sm:px-8">
        <Credit level={1} top="Email" bottom="Unsubscribe" />
        <Suspense fallback={<Walker />}>
          <Confirm searchParams={searchParams} />
        </Suspense>
      </main>
    </GridPaper>
  );
}
