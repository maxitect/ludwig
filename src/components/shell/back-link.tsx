import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start pr-2 font-display text-sm font-semibold tracking-[0.04em] uppercase underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-5" />
      {label}
    </Link>
  );
}
