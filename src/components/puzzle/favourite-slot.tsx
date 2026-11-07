import {
  FavouriteSignIn,
  FavouriteToggle,
} from "@/components/puzzle/favourite-toggle";

export type FavouriteKeys = Promise<Set<string> | null>;

/** Awaits the shared favourites promise; render each one in its own `<Suspense>`. Signed out, it links to sign-in. */
export async function FavouriteSlot({
  typeKey,
  favourites,
  next,
  compact,
  className,
}: {
  typeKey: string;
  favourites: FavouriteKeys;
  next: string;
  compact?: boolean;
  className?: string;
}) {
  const keys = await favourites;
  if (!keys) {
    return <FavouriteSignIn next={next} compact={compact} className={className} />;
  }
  return (
    <FavouriteToggle
      typeKey={typeKey}
      initial={keys.has(typeKey)}
      compact={compact}
      className={className}
    />
  );
}
