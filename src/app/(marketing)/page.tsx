import Link from "next/link";
import { Credit, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="grid-paper mx-auto flex max-w-3xl flex-col items-start gap-8 px-4 py-12 sm:px-8">
      <Wordmark variant="ink-splat" className="w-full max-w-md" />
      <Credit level={1} top="A fan-made puzzle collection" bottom="Solve it" />
      <p className="max-w-prose text-lg">
        Reverse chess, gear puzzles, ciphers and crosswords, in the style of
        the BBC One drama Ludwig.
      </p>
      <Button asChild size="lg">
        <Link href="/puzzles">Enter the Collection</Link>
      </Button>
    </main>
  );
}
