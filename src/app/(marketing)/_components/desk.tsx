import Link from "next/link";
import { Credit, GridPaper } from "@/components/brand";
import { Button } from "@/components/ui/button";

export function Desk({ name }: { name: string }) {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-3xl flex-col items-start gap-8 px-4 py-12 sm:px-8">
        <Credit level={1} top="Welcome back" bottom={name} />
        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/puzzles" transitionTypes={["bullet-hole"]}>The Collection</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/casebook">Casebook</Link>
          </Button>
        </div>
      </main>
    </GridPaper>
  );
}
