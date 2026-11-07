"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toggleFavouriteType } from "@/lib/actions/favourites";
import { cn } from "@/utils/cn";

export function FavouriteToggle({
  typeKey,
  initial,
  size,
  className,
}: {
  typeKey: string;
  initial: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  const [pressed, setPressed] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Toggle
      pressed={pressed}
      disabled={pending}
      size={size}
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
      Favourite
    </Toggle>
  );
}
