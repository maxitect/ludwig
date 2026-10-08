import Link from "next/link";
import { Credit } from "@/components/brand";

export function NotFoundNotice() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-6 px-4 py-16">
      <Credit level={1} top="Error 404" bottom="Not found" />
      <p className="max-w-prose text-lg">
        There is no page here. The puzzle you are looking for may have moved,
        or never existed.
      </p>
      <Link
        href="/puzzles"
        className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Back to the Collection
      </Link>
    </main>
  );
}
