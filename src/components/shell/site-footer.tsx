import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="group-has-[[data-solve-mode]]/body:touch:hidden mt-auto flex flex-col gap-2 border-t-2 border-border px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm">
      <p>Unofficial fan site, not affiliated with the BBC.</p>
      <p>
        <Link href="/about" className="underline underline-offset-4">
          About and credits
        </Link>
      </p>
    </footer>
  );
}
