import Link from "next/link";
import { Star } from "lucide-react";
import { FavouriteToggle } from "@/components/puzzle/favourite-toggle";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/utils/cn";

export type FavouriteKeys = Promise<Set<string> | null>;

/** Awaits the shared favourites promise; render each one in its own `<Suspense>`. Signed out, it links to sign-in. */
export async function FavouriteSlot({
  typeKey,
  favourites,
  next,
  size,
  className,
}: {
  typeKey: string;
  favourites: FavouriteKeys;
  next: string;
  size?: "default" | "sm";
  className?: string;
}) {
  const keys = await favourites;
  if (!keys) {
    return (
      <Link
        href={`/sign-in?next=${next}`}
        className={cn(toggleVariants({ size }), className)}
      >
        <Star aria-hidden="true" />
        Favourite
      </Link>
    );
  }
  return (
    <FavouriteToggle
      typeKey={typeKey}
      initial={keys.has(typeKey)}
      size={size}
      className={className}
    />
  );
}
