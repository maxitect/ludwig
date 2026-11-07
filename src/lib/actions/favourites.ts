"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordTypeVisit, setFavouriteType } from "@/lib/data/favourites";
import { requireUser } from "@/lib/data/user";
import { registry } from "@/puzzles/registry";

const typeKeySchema = z.enum(Object.keys(registry) as [string, ...string[]]);

type FavouriteResult =
  | { ok: true; favourite: boolean }
  | { ok: false; error: "invalid" };

export async function toggleFavouriteType(
  typeKey: string,
): Promise<FavouriteResult> {
  await requireUser();
  const parsed = typeKeySchema.safeParse(typeKey);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const favourite = await setFavouriteType(parsed.data);
  revalidatePath("/desk");
  return { ok: true, favourite };
}

export async function visitType(typeKey: string) {
  const parsed = typeKeySchema.safeParse(typeKey);
  if (parsed.success) await recordTypeVisit(parsed.data);
}
