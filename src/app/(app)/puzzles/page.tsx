import { Credit } from "@/components/brand";

export default function PuzzlesPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-8">
      <Credit level={1} top="Pocket puzzles" bottom="The Collection" />
      <Credit level={2} top="Not yet open" bottom="Coming soon" />
    </main>
  );
}
