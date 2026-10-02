import Link from "next/link";
import { Suspense } from "react";
import { UserSlot } from "@/components/auth/user-slot";
import { Walker, Wordmark } from "@/components/brand";
import { navLinks } from "@/config/nav";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-4 border-b-2 border-border px-4 py-3 md:gap-6">
      <Link href="/" aria-label="Ludwig, home" className="w-24 shrink-0">
        <Wordmark />
      </Link>
      <nav aria-label="Primary" className="hidden flex-1 gap-5 md:flex">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="font-display text-sm font-semibold tracking-[0.04em] uppercase underline-offset-4 hover:underline"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3 md:ml-0">
        <Suspense fallback={<Walker className="h-8 w-28" />}>
          <UserSlot />
        </Suspense>
        <MobileNav />
      </div>
    </header>
  );
}
