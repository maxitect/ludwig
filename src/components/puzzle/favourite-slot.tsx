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
    return <FavouriteSignIn next={next} size={size} className={className} />;
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
