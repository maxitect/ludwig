"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { toggleFavouriteType } from "@/lib/actions/favourites";
import { cn } from "@/utils/cn";

export function FavouriteToggle({
  typeKey,
  initial,
  compact,
  className,
}: {
  typeKey: string;
  initial: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [pressed, setPressed] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Toggle
      pressed={pressed}
      disabled={pending}
      size={compact ? "sm" : "default"}
      className={cn(
        "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        className,
      )}
      onPressedChange={(next) => {
        setPressed(next);
        startTransition(async () => {
          const result = await toggleFavouriteType(typeKey);
          setPressed(result.ok ? result.favourite : !next);
        });
      }}
    >
      <Star aria-hidden="true" className={pressed ? "fill-current" : ""} />
      <Label compact={compact} />
    </Toggle>
  );
}

export function FavouriteSignIn({
  next,
  compact,
  className,
}: {
  next: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/sign-in?next=${next}`}
      className={cn(toggleVariants({ size: compact ? "sm" : "default" }), className)}
    >
      <Star aria-hidden="true" />
      <Label compact={compact} />
    </Link>
  );
}

/** A compact control shows only the star below `lg`, where it would cover the card's thumbnail. */
function Label({ compact }: { compact?: boolean }) {
  return <span className={compact ? "max-lg:sr-only" : undefined}>Favourite</span>;
}
